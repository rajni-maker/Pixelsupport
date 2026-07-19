-- PixelSupport — initial schema + Row Level Security
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- It is safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).

-- ---------------------------------------------------------------------------
-- 0. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('admin', 'agent', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum (
    'open', 'in_progress', 'waiting_on_client', 'testing', 'resolved', 'closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  plan          text not null default 'free',   -- 'free' | 'pro' (billing stub)
  created_at    timestamptz not null default now()
);

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  role             app_role not null default 'client',
  full_name        text,
  email            text,
  created_at       timestamptz not null default now()
);

create table if not exists tickets (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  client_id          uuid references profiles(id) on delete set null,
  assigned_agent_id  uuid references profiles(id) on delete set null,
  subject            text not null,
  description        text,
  status             ticket_status not null default 'open',
  priority           ticket_priority not null default 'medium',
  ai_summary         text,
  ai_suggested_tags  text[],
  category           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists ticket_messages (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references tickets(id) on delete cascade,
  sender_id      uuid references profiles(id) on delete set null,
  sender_role    app_role,
  body           text not null,
  is_ai_drafted  boolean not null default false,
  is_internal    boolean not null default false,   -- internal note; hidden from clients
  created_at     timestamptz not null default now()
);

create table if not exists ticket_status_history (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  old_status  ticket_status,
  new_status  ticket_status not null,
  changed_by  uuid references profiles(id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index if not exists idx_profiles_org        on profiles(organization_id);
create index if not exists idx_tickets_org         on tickets(organization_id);
create index if not exists idx_tickets_client      on tickets(client_id);
create index if not exists idx_tickets_agent       on tickets(assigned_agent_id);
create index if not exists idx_messages_ticket     on ticket_messages(ticket_id);
create index if not exists idx_history_ticket      on ticket_status_history(ticket_id);

-- ---------------------------------------------------------------------------
-- 2. Helper functions (used by RLS policies)
--    SECURITY DEFINER so they can read profiles without recursive RLS checks.
-- ---------------------------------------------------------------------------
create or replace function auth_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function auth_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 3. Auto-provision org + admin profile on first signup
--    When a new auth user is created, create their organization and an admin
--    profile. The org name comes from signup metadata ('org_name'), falling
--    back to the email.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id uuid;
begin
  insert into organizations (company_name)
  values (coalesce(new.raw_user_meta_data->>'org_name', new.email, 'My Organization'))
  returning id into new_org_id;

  insert into profiles (id, organization_id, role, full_name, email)
  values (
    new.id,
    new_org_id,
    'admin',
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- keep tickets.updated_at fresh
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_tickets_touch on tickets;
create trigger trg_tickets_touch
  before update on tickets
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security — every query is scoped to the user's organization
-- ---------------------------------------------------------------------------
alter table organizations         enable row level security;
alter table profiles              enable row level security;
alter table tickets               enable row level security;
alter table ticket_messages       enable row level security;
alter table ticket_status_history enable row level security;

-- organizations: members can read their own org
drop policy if exists org_select on organizations;
create policy org_select on organizations
  for select using (id = auth_org_id());

-- profiles: you can read profiles in your org; you can update your own row
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (organization_id = auth_org_id());

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (id = auth.uid());

-- tickets: everyone in the org can read; clients only see their own tickets
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (
    organization_id = auth_org_id()
    and (auth_role() in ('admin','agent') or client_id = auth.uid())
  );

drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert with check (organization_id = auth_org_id());

drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update using (
    organization_id = auth_org_id()
    and (auth_role() in ('admin','agent') or client_id = auth.uid())
  );

-- ticket_messages: readable if you can see the parent ticket; clients can't see internal notes
drop policy if exists messages_select on ticket_messages;
create policy messages_select on ticket_messages
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (auth_role() in ('admin','agent') or t.client_id = auth.uid())
    )
    and (auth_role() in ('admin','agent') or is_internal = false)
  );

drop policy if exists messages_insert on ticket_messages;
create policy messages_insert on ticket_messages
  for insert with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (auth_role() in ('admin','agent') or t.client_id = auth.uid())
    )
  );

-- status history: readable if you can see the parent ticket
drop policy if exists history_select on ticket_status_history;
create policy history_select on ticket_status_history
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and t.organization_id = auth_org_id()
        and (auth_role() in ('admin','agent') or t.client_id = auth.uid())
    )
  );

drop policy if exists history_insert on ticket_status_history;
create policy history_insert on ticket_status_history
  for insert with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and t.organization_id = auth_org_id()
    )
  );
