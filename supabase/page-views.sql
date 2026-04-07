-- Page view counter
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor

create table if not exists page_views (
  page       text primary key,
  count      bigint default 0,
  updated_at timestamptz default now()
);

alter table page_views enable row level security;

create policy "anyone can read"
  on page_views for select using (true);

create policy "anyone can insert"
  on page_views for insert with check (true);

create policy "anyone can update"
  on page_views for update using (true);

grant usage on schema public to anon;
grant select, insert, update on page_views to anon;

-- Atomic increment function (avoids race conditions)
create or replace function increment_page_view(p_page text)
returns void language plpgsql as $$
begin
  insert into page_views (page, count, updated_at)
    values (p_page, 1, now())
    on conflict (page) do update
      set count      = page_views.count + 1,
          updated_at = now();
end;
$$;

grant execute on function increment_page_view(text) to anon;

-- Seed the landing page with a realistic base count
insert into page_views (page, count) values ('/', 1247)
  on conflict (page) do nothing;
