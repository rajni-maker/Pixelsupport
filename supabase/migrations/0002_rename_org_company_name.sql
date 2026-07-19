-- PixelSupport — rename organizations.name -> organizations.company_name
-- Paste into the Supabase SQL Editor and click "Run".

-- 1. Rename the column (safe if it hasn't been renamed already).
do $$ begin
  alter table organizations rename column name to company_name;
exception when undefined_column then null; end $$;

-- 2. The signup trigger inserts into this column, so recreate it to use the
--    new name. (Without this, new signups would fail.)
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
