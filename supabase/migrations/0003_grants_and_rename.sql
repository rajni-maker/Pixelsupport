-- PixelSupport — fix: grant base table privileges (+ ensure company_name rename)
-- Paste into the Supabase SQL Editor and click "Run". Safe to run once.
--
-- Why this exists: RLS controls WHICH ROWS a user sees, but a role also needs
-- base table privileges to touch a table at all. Those were missing, which made
-- logged-in reads fail ("permission denied"), leaving the dashboard blank.

-- ---------------------------------------------------------------------------
-- 1. Ensure the organizations.name -> company_name rename is applied
--    (no-op if it was already renamed by migration 0002).
-- ---------------------------------------------------------------------------
do $$ begin
  alter table organizations rename column name to company_name;
exception when undefined_column then null; end $$;

-- Recreate the signup trigger to use company_name (idempotent).
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

-- ---------------------------------------------------------------------------
-- 2. Grant base table privileges. RLS policies still restrict rows;
--    these grants just allow the roles to reach the tables.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to authenticated, service_role;

-- Make sure any tables we add later inherit the same grants automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
