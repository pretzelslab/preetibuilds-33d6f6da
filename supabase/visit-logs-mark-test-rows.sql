-- Mark two known diagnostic rows as test records (run AFTER
-- visit-logs-add-is-test-column.sql has been applied).
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor
--
-- Both ids were captured directly from this session's own tool output —
-- not inferred from location, timing, or page name — so this only ever
-- touches these two specific rows:
--
--   3bd1759f-d5bc-4e24-8ebf-8349f8a67bcf
--     page: /carbon-router-TESTVERIFY (synthetic page slug, does not match
--     any real app route — created manually via a REST call while
--     diagnosing why the real useVisitLogger flow wasn't firing on a
--     PageGate-protected route)
--
--   bcefab34-ed23-49d9-af04-0abb2be74deb
--     page: /gtm-techstack (a real route — this row is otherwise
--     indistinguishable from genuine traffic to that page except by this
--     exact id, which is why an id-based marker is required rather than a
--     page-name or location-based filter; created through the actual app
--     flow to verify the geo-capture pipeline end to end)
--
-- Only the new is_test column is touched — no other field on these rows,
-- and no other row in the table, is modified.

update visit_logs
set is_test = true
where id in (
  '3bd1759f-d5bc-4e24-8ebf-8349f8a67bcf',
  'bcefab34-ed23-49d9-af04-0abb2be74deb'
);
