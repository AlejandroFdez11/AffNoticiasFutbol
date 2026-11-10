-- AFFutbol — Phase 7: real standings and scorers
--
-- Run this in the Supabase SQL editor (or with `supabase db push`). The app
-- only ever reads `statistics_snapshots`; the `sync-statistics` Edge Function
-- writes to it with the service role key, so no client can edit the numbers.
--
-- One row per league and `payload` holds the whole `StoredLeagueSnapshot` the
-- screen renders (league info, standings and scorers). A JSON blob is enough
-- because nothing queries individual rows: the app always asks for a full
-- league, and it keeps the stored shape free to evolve with the mappers.
--
-- Sources: football-data.org (standings and crests) and Wikipedia (goals only).

create table if not exists public.statistics_snapshots (
  league_id text primary key
    check (league_id in ('laliga', 'premier', 'seriea', 'bundesliga')),
  season text not null,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.statistics_snapshots enable row level security;

drop policy if exists "Statistics snapshots are viewable by everyone"
  on public.statistics_snapshots;
create policy "Statistics snapshots are viewable by everyone"
  on public.statistics_snapshots
  for select
  using (true);

-- Read-only for clients. The service role used by the Edge Function bypasses
-- RLS, and no insert/update/delete policy exists on purpose.
grant select on public.statistics_snapshots to anon, authenticated;
