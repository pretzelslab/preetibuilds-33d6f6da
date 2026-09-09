-- Add geolocation columns to visit_logs (idempotent, non-destructive)
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor
--
-- Note: city/country were added to the live table previously outside of
-- version control (visit-logs.sql never reflected them). This migration is
-- safe to run regardless of current column state and adds `region` as new.
-- No existing rows are modified; historical rows keep NULL for any column
-- they predate.

alter table visit_logs add column if not exists city text;
alter table visit_logs add column if not exists country text;
alter table visit_logs add column if not exists region text;
