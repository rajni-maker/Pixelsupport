-- PixelSupport — 0007: restrict Support Rep ticket visibility  (safe to re-run)
--
-- Change: a support_rep now sees only tickets ASSIGNED TO THEM or UNASSIGNED
-- (so they can still pick up new work) — not tickets owned by another rep.
-- organization_admin still sees all org tickets; company_contact still sees
-- all of their own company's tickets.
--
-- This is RLS-only. The access rule for a ticket t is:
--   t.organization_id = auth_org_id()
--   AND ( admin
--         OR (support_rep AND (assigned to me OR unassigned))
--         OR company_id = my company )

-- tickets: SELECT
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (
    organization_id = auth_org_id()
    and (
      auth_role() = 'organization_admin'
      or (auth_role() = 'support_rep'
          and (assigned_agent_id = auth.uid() or assigned_agent_id is null))
      or company_id = auth_company_id()
    )
  );

-- tickets: UPDATE — you may only act on tickets you can see (USING mirrors
-- SELECT). WITH CHECK stays permissive for internal staff so assignment/
-- reassignment still works (a rep can claim an unassigned ticket, or hand one
-- off to another rep, even though it then leaves their own view).
drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update using (
    organization_id = auth_org_id()
    and (
      auth_role() = 'organization_admin'
      or (auth_role() = 'support_rep'
          and (assigned_agent_id = auth.uid() or assigned_agent_id is null))
      or company_id = auth_company_id()
    )
  ) with check (
    organization_id = auth_org_id()
    and (
      auth_role() in ('organization_admin','support_rep')
      or company_id = auth_company_id()
    )
  );

-- ticket_messages: SELECT — mirror ticket visibility; contacts never see internal notes.
drop policy if exists messages_select on ticket_messages;
create policy messages_select on ticket_messages
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() = 'organization_admin'
          or (auth_role() = 'support_rep'
              and (t.assigned_agent_id = auth.uid() or t.assigned_agent_id is null))
          or t.company_id = auth_company_id()
        )
    )
    and (auth_role() in ('organization_admin','support_rep') or is_internal = false)
  );

-- ticket_messages: INSERT — you may only reply to tickets you can see.
drop policy if exists messages_insert on ticket_messages;
create policy messages_insert on ticket_messages
  for insert with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() = 'organization_admin'
          or (auth_role() = 'support_rep'
              and (t.assigned_agent_id = auth.uid() or t.assigned_agent_id is null))
          or t.company_id = auth_company_id()
        )
    )
  );

-- ticket_status_history: SELECT — mirror ticket visibility.
drop policy if exists history_select on ticket_status_history;
create policy history_select on ticket_status_history
  for select using (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and t.organization_id = auth_org_id()
        and (
          auth_role() = 'organization_admin'
          or (auth_role() = 'support_rep'
              and (t.assigned_agent_id = auth.uid() or t.assigned_agent_id is null))
          or t.company_id = auth_company_id()
        )
    )
  );
