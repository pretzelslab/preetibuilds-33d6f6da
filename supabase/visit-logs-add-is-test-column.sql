-- Add a test-record marker to visit_logs (idempotent, additive, non-destructive)
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor
--
-- Purpose: distinguish diagnostic/verification rows (created while testing the
-- geo-capture pipeline) from genuine visitor traffic, without deleting or
-- altering either. Defaults every existing and future row to is_test = false,
-- so no backfill/repurposing of existing data is needed — only the two rows
-- named in visit-logs-mark-test-rows.sql get flipped to true, by exact id.
--
-- No existing column, row value, or access policy is changed by this file.

alter table visit_logs
  add column if not exists is_test boolean not null default false;
