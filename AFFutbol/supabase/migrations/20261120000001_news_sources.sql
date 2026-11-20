-- AFFutbol — broaden the RSS feed with three more live, free sources
--
-- The original news migration seeded six feeds. This migration adds sources
-- that were verified against their live XML on 20 Nov 2026: 20minutos (Spain),
-- La Vanguardia (Spain) and ESPN (Spanish-language international coverage).
-- As always, adding or disabling a feed is data, not code: an UPDATE on
-- public.news_sources is enough to remove it without redeploying anything.

insert into public.news_sources (id, label, feed_url, kind, topic, path_filter, priority, max_items)
values
  (
    '20minutos-futbol',
    '20minutos',
    'https://www.20minutos.es/rss/deportes/futbol/',
    'news',
    'LaLiga',
    null,
    25,
    20
  ),
  (
    'lavanguardia-futbol',
    'La Vanguardia',
    'https://www.lavanguardia.com/rss/deportes/futbol.xml',
    'news',
    'LaLiga',
    null,
    35,
    20
  ),
  (
    'espn-futbol',
    'ESPN',
    'https://www.espn.com.ar/espn/rss/soccer/news',
    'news',
    'Otras ligas',
    '/futbol/',
    60,
    20
  )
on conflict (id) do update set
  label = excluded.label,
  feed_url = excluded.feed_url,
  kind = excluded.kind,
  topic = excluded.topic,
  path_filter = excluded.path_filter,
  priority = excluded.priority,
  max_items = excluded.max_items;
