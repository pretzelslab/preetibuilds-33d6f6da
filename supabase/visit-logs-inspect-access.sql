-- Read-only inspection — no writes, safe to run any time in the SQL Editor
-- at https://mfhjopfnmtujjyojokeg.supabase.co
--
-- Purpose: confirm exactly what the `anon` role can currently do to
-- visit_logs before applying admin-auth-authorization.sql. In particular,
-- this resolves the open question of whether `anon` has an untracked DELETE
-- grant (city/country/region columns were all added live once before ever
-- being tracked in a migration file — a DELETE grant existing the same way
-- is plausible and has not been confirmed either way).

-- 1. Every privilege currently granted on visit_logs, by role
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'visit_logs'
order by grantee, privilege_type;

-- 2. Every RLS policy currently on visit_logs
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'visit_logs';

-- 3. Whether RLS is even enabled on the table (should be true)
select relrowsecurity
from pg_class
where relname = 'visit_logs';

-- 4. Any existing Auth users in this project (so we know whether an admin
--    account already exists here, or needs to be created via
--    Dashboard → Authentication → Users → Add user)
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at;
