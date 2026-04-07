-- Visitor log table
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor

create table if not exists visit_logs (
  id          uuid default gen_random_uuid() primary key,
  page        text not null,
  referrer    text,
  user_agent  text,
  visited_at  timestamptz default now()
);

alter table visit_logs enable row level security;

create policy "anyone can insert"
  on visit_logs for insert with check (true);

create policy "anyone can select"
  on visit_logs for select using (true);

grant usage on schema public to anon;
grant select, insert on visit_logs to anon;
