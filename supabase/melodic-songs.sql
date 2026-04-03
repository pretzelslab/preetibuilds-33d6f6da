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




Melodic: 
1. Move you tube search below song title.
2. Once corrected names are added, retain names to allow repopualiton in future
3. Allow auto-populate in sing title entry when keying in to select next word in turn enabling youtube list display to allow end user to choose from the youtube list 
4. Youtube entry once selecetd and removed removes the youtube search option completely. Youtube search option to persist
5. Positioning of Back to Portfolio in Melodic to stay consistent across the portfolio. Indenation doesn't seem to match with other projects 
6. Since Melodic has few additional things underway to be compleetd when it comes to search lets do a preview option for that too in vercel for now
7. auto populate keeps the values as a hung down value below the text box while also populating the value within the next box for singer, movie, composer. Doesn't clear when I click away from the text boxes. 
8. Couldn't make an entry in Post. Says- couldn't post- try again.
9. Admin PIN is repeated twice. Once within notes and comments and one right below. Both don't do anything.
10. Future enhancement: add melodic framework asssesment- auto-match and select raaga. There may be applications already doing this but I need this search to be super intelligent. I basically need to be able to tell which raaga it is when a song is keyed in to match its tune scale with the arohan/avrohan scale of the raaga

GTM:
Also loads somewhere in the middle when clicked. Similar goes with AI Readiness assessment.

All:
Ensure all projects land at the top when clicked form the landing page. 
All workbooks have to land at the page last populated.

Back to portfolio:
Finally when all pages click back to 'Back to Portfolio' it should take the visitor back to the place where the click was initiated.

Landing page and subsequenct page font and overall look and feel:
Landing page font should be please to the eyes and so goes for the other pages. what other fonts do you suggest?
Need new age look and feel overall! 


