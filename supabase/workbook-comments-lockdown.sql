-- Client Workbook comments: move all access behind api/workbook-comments.ts
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor
--
-- Two steps, deliberately separated:
--
--   STEP 1: additive. Run BEFORE (or at) the deploy that ships
--           api/workbook-comments.ts. The new server inserts write
--           edit_token_hash, so the column must already exist or every new
--           comment fails. Harmless to the currently deployed site, because the
--           old client code never touches this column.
--
--   STEP 2: lockdown. Run AFTER the deploy is live and verified. Removes every
--           anon policy and grant, so the table is reachable only through the
--           service-role key used by api/workbook-comments.ts. Running it
--           before the deploy would break comments on the live site.
--
-- Existing rows keep edit_token_hash = NULL, so they are editable/deletable by
-- the owner only (no browser holds a token for them).


-- ── STEP 1 (before/at deploy) ───────────────────────────────────────────────
alter table workbook_comments
  add column if not exists edit_token_hash text;


-- ── STEP 2 (after deploy is verified) ───────────────────────────────────────
-- Uncomment and run once the live site's workbook comments are confirmed
-- working through /api/workbook-comments.
--
-- drop policy if exists "read thread comments" on workbook_comments;
-- drop policy if exists "insert comments"      on workbook_comments;
-- drop policy if exists "update comments"      on workbook_comments;
-- drop policy if exists "delete comments"      on workbook_comments;
--
-- revoke select, insert, update, delete on workbook_comments from anon;
-- revoke select, insert, update, delete on workbook_comments from authenticated;
--
-- -- RLS stays enabled with no policies → deny-all for anon/authenticated.
-- -- The service role bypasses RLS, so the API keeps working.
-- alter table workbook_comments enable row level security;


-- ── Verify (after STEP 2) ───────────────────────────────────────────────────
-- Expect zero rows:
--   select policyname from pg_policies where tablename = 'workbook_comments';
-- Expect no anon/authenticated privileges:
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_name = 'workbook_comments' and grantee in ('anon', 'authenticated');
