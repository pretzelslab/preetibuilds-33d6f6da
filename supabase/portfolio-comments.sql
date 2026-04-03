-- Portfolio comments / guestbook
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor

create table if not exists portfolio_comments (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  message     text not null,
  reply       text,
  created_at  timestamptz default now(),
  approved    boolean default true
);

-- Allow anyone to read approved comments
alter table portfolio_comments enable row level security;

create policy "read approved comments"
  on portfolio_comments for select
  using (approved = true);

create policy "insert comments"
  on portfolio_comments for insert
  with check (true);

-- Owner reply update (uses service role key — only update reply column)
create policy "owner reply"
  on portfolio_comments for update
  using (true)
  with check (true);
