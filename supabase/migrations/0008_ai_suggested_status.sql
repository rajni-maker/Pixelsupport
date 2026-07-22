-- PixelSupport — 0008: AI-suggested status  (safe to re-run)
--
-- Automatic status movement on reply is decided in application code. The two
-- low-risk transitions (open -> in_progress, waiting_on_client -> in_progress)
-- are applied immediately, but "this looks resolved" is a judgement call we
-- leave to a human. This column parks that suggestion until an admin or rep
-- applies or dismisses it.
--
-- NULL = no pending suggestion. Cleared whenever the status actually changes.
-- No RLS changes needed: it rides along on the existing tickets policies.

alter table tickets
  add column if not exists ai_suggested_status text;
