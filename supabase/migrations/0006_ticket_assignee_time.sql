-- PixelSupport — 0006: ticket time tracking  (safe to re-run)
--
-- Assignment already works via tickets.assigned_agent_id (added in 0001), so
-- this migration only adds time tracking. Time is stored as a single integer
-- (total minutes) to avoid an inconsistent hours/minutes split; the UI shows
-- separate hour + minute inputs and combines them.

alter table tickets
  add column if not exists time_spent_minutes integer not null default 0;
