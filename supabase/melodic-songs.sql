-- ── melodic_song_requests ──────────────────────────────────────────────────
-- Run in: mfhjopfnmtujjyojokeg.supabase.co → SQL Editor
-- Stores visitor-submitted songs pending admin review.
-- Admin approves → song appears in the Melodic Framework page for everyone.

create table if not exists melodic_song_requests (
  id          uuid primary key default gen_random_uuid(),
  raaga_id    text not null,
  title       text not null,
  singer      text not null,
  movie       text,
  composer    text,
  genre       text not null default 'Film',
  youtube_id  text,
  youtube_query text,
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz default now()
);

-- Public: anyone can read approved songs
create policy "read approved songs"
  on melodic_song_requests for select
  using (status = 'approved');

-- Public: anyone can submit (insert) a song request
create policy "submit song request"
  on melodic_song_requests for insert
  with check (true);

-- Service role only for admin updates (approve/reject) — done via anon key + RLS bypass
-- To allow anon admin updates (PIN enforced in UI, not DB), use:
create policy "admin update"
  on melodic_song_requests for update
  using (true);

alter table melodic_song_requests enable row level security;
