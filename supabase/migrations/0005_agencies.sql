-- PixelSupport — 0005: Agencies model
-- Paste into the Supabase SQL Editor and click "Run". Safe to re-run.
--
-- Introduces the agency hierarchy:
--   organizations = the AGENCY (e.g. Pixelmattic)
--   companies     = client orgs under an agency  (NEW)
--   profiles      = internal staff (company_id NULL) or client contacts (company_id set)
-- Renames role enum values and rewrites RLS so a company_contact sees ALL of
-- their company's tickets (shared inbox), not just tickets they personally opened.
--
-- Ordering matters: enum values are RENAMED before any policy/trigger references
-- the new labels. We deliberately use RENAME VALUE (never ADD VALUE), because
-- RENAME VALUE is transaction-safe AND a renamed label is usable in the SAME
-- transaction — unlike ADD VALUE, which cannot be used in the transaction that
-- adds it.

-- ===========================================================================
-- 1. Rename organizations.company_name -> organizations.name  (guarded)
-- ===========================================================================
do $$ begin
  alter table organizations rename column company_name to name;
exception when undefined_column then null; end $$;

-- ===========================================================================
-- 2. Rename role enum values (each guarded so an already-renamed label is a
--    no-op — re-running never aborts the script). RENAME VALUE keeps each
--    pg_enum row's OID, so existing rows and stored defaults remain valid.
-- ===========================================================================
do $$
begin
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
             where t.typname = 'app_role' and e.enumlabel = 'admin') then
    alter type app_role rename value 'admin' to 'organization_admin';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
             where t.typname = 'app_role' and e.enumlabel = 'agent') then
    alter type app_role rename value 'agent' to 'support_rep';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
             where t.typname = 'app_role' and e.enumlabel = 'client') then
    alter type app_role rename value 'client' to 'company_contact';
  end if;
end $$;

-- Make the profiles.role default explicit under the new label.
alter table profiles alter column role set default 'company_contact';

-- ===========================================================================
-- 3. NEW table: companies (client orgs under an agency)
-- ===========================================================================
create table if not exists companies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_companies_org on companies(organization_id);

alter table companies enable row level security;

grant select, insert, update, delete on companies to authenticated;
grant all on companies to service_role;

-- ===========================================================================
-- 4. Add company_id to profiles and tickets
-- ===========================================================================
alter table profiles
  add column if not exists company_id uuid references companies(id) on delete cascade;

alter table tickets
  add column if not exists company_id uuid references companies(id) on delete set null;

create index if not exists idx_profiles_company on profiles(company_id);
create index if not exists idx_tickets_company  on tickets(company_id);

-- ===========================================================================
-- 5. New RLS helper: auth_company_id()  (security definer, no recursive RLS)
-- ===========================================================================
create or replace function auth_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid();
$$;

-- ===========================================================================
-- 6. Rewrite handle_new_user(): read organization_id / role / company_id.
--    Defined AFTER the enum rename so the new labels resolve, and inserts
--    into organizations(name).
-- ===========================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id      uuid;
  invited_org     uuid;
  invited_role    app_role;
  invited_company uuid;
begin
  invited_org := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;

  if invited_org is not null then
    -- Invited member: join the existing agency with the chosen role.
    invited_role := coalesce(
      nullif(new.raw_user_meta_data->>'role', '')::app_role,
      'company_contact'
    );
    invited_company := nullif(new.raw_user_meta_data->>'company_id', '')::uuid;

    insert into profiles (id, organization_id, role, company_id, full_name, email)
    values (
      new.id,
      invited_org,
      invited_role,
      invited_company,
      new.raw_user_meta_data->>'full_name',
      new.email
    );
  else
    -- Self-signup: create a new agency and become its organization_admin.
    insert into organizations (name)
    values (coalesce(
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'org_name',
      new.email,
      'My Organization'
    ))
    returning id into new_org_id;

    insert into profiles (id, organization_id, role, company_id, full_name, email)
    values (
      new.id,
      new_org_id,
      'organization_admin',
      null,
      new.raw_user_meta_data->>'full_name',
      new.email
    );
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===========================================================================
-- 7. companies policies
-- ===========================================================================
drop policy if exists companies_select on companies;
create policy companies_select on companies
  for select using (organization_id = auth_org_id());

drop policy if exists companies_insert on companies;
create policy companies_insert on companies
  for insert with check (
    organization_id = auth_org_id()
    and auth_role() in ('organization_admin','support_rep')
  );

drop policy if exists companies_update on companies;
create policy companies_update on companies
  for update using (
    organization_id = auth_org_id()
    and auth_role() in ('organization_admin','support_rep')
  ) with check (
    organization_id = auth_org_id()
    and auth_role() in ('organization_admin','support_rep')
  );

drop policy if exists companies_delete on companies;
create policy companies_delete on companies
  for delete using (
    organization_id = auth_org_id()
    and auth_role() in ('organization_admin','support_rep')
  );

-- ===========================================================================
-- 8. Recreate role-referencing policies with new labels + company visibility.
--    Internal roles see/act on all org rows; a company_contact is scoped to
--    tickets whose company_id matches their own (shared across contacts).
-- ===========================================================================

drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (
    organization_id = auth_org_id()
    and (
      auth_role() in ('organization_admin','support_rep')
      or company_id = auth_company_id()
    )
  );

drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update using (
    organization_id = auth_org_id()
    and (
      auth_role() in ('organization_admin','support_rep')
      or company_id = auth_company_id()
    )
  ) with check (
    organization_id = auth_org_id()
    and (
      auth_role() in ('organization_admin','support_rep')
      or company_id = auth_company_id()
    )
  );

drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert with check (organization_id = auth_org_id());

drop policy if exists messages_select on ticket_messages;
create policy messages_select on ticket_messages
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() in ('organization_admin','support_rep')
          or t.company_id = auth_company_id()
        )
    )
    and (auth_role() in ('organization_admin','support_rep') or is_internal = false)
  );

drop policy if exists messages_insert on ticket_messages;
create policy messages_insert on ticket_messages
  for insert with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() in ('organization_admin','support_rep')
          or t.company_id = auth_company_id()
        )
    )
  );

drop policy if exists history_select on ticket_status_history;
create policy history_select on ticket_status_history
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() in ('organization_admin','support_rep')
          or t.company_id = auth_company_id()
        )
    )
  );

-- history_insert (org match only), org_select, profiles_select,
-- profiles_update_self are intentionally left unchanged.
