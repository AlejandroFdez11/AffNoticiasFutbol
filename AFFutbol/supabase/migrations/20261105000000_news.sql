-- AFFutbol — Phase 2b: real news and transfer-rumour feed
--
-- Run this in the Supabase SQL editor (or with `supabase db push`). The app
-- only ever reads `news_items`; the `news-refresh` Edge Function writes to it
-- with the service role key, so no client can insert or edit content.
--
-- Sources are rows, not code: a feed that breaks or blocks us can be disabled
-- with a single UPDATE, without redeploying the function.

create table if not exists public.news_sources (
  id text primary key,
  label text not null,
  feed_url text not null,
  kind text not null check (kind in ('news', 'rumor')),
  topic text not null default 'Otras ligas',
  -- Only keep items whose URL contains this path, e.g. `/futbol/`.
  path_filter text,
  priority integer not null default 100,
  max_items integer not null default 20 check (max_items between 1 and 50),
  enabled boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- Idempotent for projects where the first version of this migration ran.
alter table public.news_sources add column if not exists path_filter text;

create table if not exists public.news_items (
  id text primary key,
  kind text not null check (kind in ('news', 'rumor')),
  title text not null,
  summary text not null default '',
  topic text not null default 'Otras ligas',
  source_id text references public.news_sources (id) on delete set null,
  source_label text not null,
  source_url text not null,
  image_url text,
  author text,
  published_at timestamptz not null,
  status text check (status is null or status in ('rumor', 'negociando', 'avanzado', 'descartado')),
  player text,
  club_from text,
  club_from_id integer,
  club_to text,
  club_to_id integer,
  fee text,
  tags text[] not null default '{}',
  fetched_at timestamptz not null default timezone('utc', now())
);

create index if not exists news_items_published_at_idx on public.news_items (published_at desc);
create index if not exists news_items_kind_idx on public.news_items (kind);

alter table public.news_sources enable row level security;
alter table public.news_items enable row level security;

drop policy if exists "News sources are viewable by everyone" on public.news_sources;
create policy "News sources are viewable by everyone"
  on public.news_sources
  for select
  using (true);

drop policy if exists "News items are viewable by everyone" on public.news_items;
create policy "News items are viewable by everyone"
  on public.news_items
  for select
  using (true);

-- Read-only for clients. The service role used by the Edge Function bypasses
-- RLS, and no insert/update/delete policy exists on purpose.
grant select on public.news_sources to anon, authenticated;
grant select on public.news_items to anon, authenticated;

-- Spanish-language sources only. Marca covers the Madrid side, Mundo Deportivo
-- the Barcelona side and Relevo is neutral, which keeps the feed balanced.
-- The path filter drops the tennis, cycling and crime stories that share the
-- front-page feeds with football.
insert into public.news_sources (id, label, feed_url, kind, topic, path_filter, priority, max_items)
values
  ('marca-portada', 'Marca', 'https://e00-marca.uecdn.es/rss/portada.xml', 'news', 'LaLiga', '/futbol/', 10, 20),
  ('marca-primera', 'Marca', 'https://e00-marca.uecdn.es/rss/futbol/primera-division.xml', 'news', 'LaLiga', '/futbol/', 20, 20),
  ('marca-internacional', 'Marca', 'https://e00-marca.uecdn.es/rss/futbol/futbol-internacional.xml', 'news', 'Champions League', '/futbol/', 30, 15),
  ('marca-mercado', 'Marca', 'https://www.marca.com/rss/futbol/mercado-fichajes.xml', 'rumor', 'Mercado', '/futbol/', 10, 25),
  ('mundodeportivo-futbol', 'Mundo Deportivo', 'https://www.mundodeportivo.com/rss/futbol', 'news', 'LaLiga', null, 40, 20),
  ('relevo-portada', 'Relevo', 'https://relevo.com/rss', 'news', 'LaLiga', '/futbol/', 50, 15)
on conflict (id) do update set
  label = excluded.label,
  feed_url = excluded.feed_url,
  kind = excluded.kind,
  topic = excluded.topic,
  path_filter = excluded.path_filter,
  priority = excluded.priority,
  max_items = excluded.max_items;
