-- Admin authentication + authorization for visit_logs (govDb project:
-- mfhjopfnmtujjyojokeg.supabase.co)
--
-- NOT APPLIED. Review before running. Run visit-logs-inspect-access.sql
-- first — its query #4 tells you whether the admin Auth user below already
-- exists or still needs to be created via
-- Dashboard → Authentication → Users → Add user (Supabase Auth users are
-- created through the Auth API/dashboard, not by inserting into auth.users
-- directly).
--
-- What this does:
--   1. Creates admin_users, an allowlist of auth.users.id values that are
--      permitted to read/delete visit_logs. A table (not a hardcoded UUID
--      inline in each policy) so a second admin can be added later with one
--      INSERT instead of editing policy SQL.
--   2. Locks visit_logs SELECT and DELETE down to rows checked against that
--      allowlist, for the `authenticated` role only.
--   3. Revokes the current `anon` SELECT grant entirely — this is the actual
--      fix for the confirmed finding that the public anon key (present in
--      every page's JS bundle, not just /admin's) can read visit_logs
--      directly via a raw REST call, bypassing the UI entirely.
--   4. Leaves anon INSERT untouched — anonymous visit logging must keep
--      working from every page, including for visitors who never sign in.
--
-- What this deliberately does NOT change:
--   - Whether `anon` currently has a DELETE grant is unconfirmed (see
--     visit-logs-inspect-access.sql query #1). If that query shows one,
--     add `revoke delete on visit_logs from anon;` below before running —
--     left as an explicit decision rather than assumed here.

-- ── 1. Admin allowlist ──────────────────────────────────────────────────────
create table if not exists admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

-- No one needs client-side access to this table at all — every check against
-- it happens inside visit_logs' own policies below (which run with the
-- privileges of the policy definer, not the querying role), so it gets no
-- grants and no policies of its own beyond RLS being on.

-- Seed the one admin account by email once you know it (fill in below).
-- Safe to re-run: does nothing if the row already exists.
-- insert into admin_users (user_id, email)
-- select id, email from auth.users where email = 'ADMIN_EMAIL_HERE'
-- on conflict (user_id) do nothing;

-- ── 2. Lock down visit_logs ─────────────────────────────────────────────────
drop policy if exists "anyone can select" on visit_logs;

create policy "admin can select"
  on visit_logs for select
  to authenticated
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "admin can delete"
  on visit_logs for delete
  to authenticated
  using (exists (select 1 from admin_users where user_id = auth.uid()));

revoke select on visit_logs from anon;
grant select, delete on visit_logs to authenticated;

-- Anonymous insert is unchanged — still required for visit logging from any
-- visitor, signed in or not:
--   policy "anyone can insert" on visit_logs for insert with check (true);
--   grant insert on visit_logs to anon;
