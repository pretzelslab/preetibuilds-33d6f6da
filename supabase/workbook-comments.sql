-- Client Workbook comments (per client + phase/page thread)
-- Run in: mfhjopfnmtujjyojokeg.supabase.co > SQL Editor
--
-- Confidential: comment bodies may reference real client names and business detail.
-- Access model: client_id/page_id are unguessable UUIDs / fixed slugs generated client-side
-- (crypto.randomUUID() for client_id), used as a capability token — the same trust model
-- the rest of this localStorage-only workbook already relies on (no server-side auth exists
-- in this app yet). Do not widen this table's access beyond that assumption without adding
-- real auth first.

create table if not exists workbook_comments (
  id          uuid default gen_random_uuid() primary key,
  client_id   text not null,
  page_id     text not null,
  body        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists workbook_comments_thread_idx
  on workbook_comments (client_id, page_id, created_at);

alter table workbook_comments enable row level security;

create policy "read thread comments"
  on workbook_comments for select
  using (true);

create policy "insert comments"
  on workbook_comments for insert
  with check (true);

create policy "update comments"
  on workbook_comments for update
  using (true)
  with check (true);

create policy "delete comments"
  on workbook_comments for delete
  using (true);

-- Grant table-level access to anon role (required even with permissive RLS)
grant usage on schema public to anon;
grant select, insert, update, delete on workbook_comments to anon;
