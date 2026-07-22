-- PixelSupport — let admins invite members into their existing company.
-- Paste into the Supabase SQL Editor and click "Run". Safe to re-run.
--
-- Until now, EVERY new signup created a new company and became its admin.
-- This updates the trigger so that when a user is created WITH an
-- organization_id in their metadata (i.e. added by an admin), they join that
-- company with the given role instead of starting a new one.

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id   uuid;
  invited_org  uuid;
  invited_role app_role;
begin
  invited_org := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;

  if invited_org is not null then
    -- Invited team member: join the existing company with the chosen role.
    invited_role := coalesce(
      nullif(new.raw_user_meta_data->>'role', '')::app_role,
      'client'
    );
    insert into profiles (id, organization_id, role, full_name, email)
    values (
      new.id,
      invited_org,
      invited_role,
      new.raw_user_meta_data->>'full_name',
      new.email
    );
  else
    -- Normal self-signup: create a new company and become its admin.
    insert into organizations (company_name)
    values (coalesce(
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'org_name',
      new.email,
      'My Organization'
    ))
    returning id into new_org_id;

    insert into profiles (id, organization_id, role, full_name, email)
    values (
      new.id,
      new_org_id,
      'admin',
      new.raw_user_meta_data->>'full_name',
      new.email
    );
  end if;

  return new;
end $$;
