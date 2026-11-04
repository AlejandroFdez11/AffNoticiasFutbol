import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/features/auth/supabase';

import { CONTENT_STALE_TIME_MS } from './constants';
import { buildFeed, findFeedItem } from './feed';
import type { ContentTopic, FeedItem, RumorStatus } from './types';

export const newsKeys = {
  all: ['news'] as const,
  feed: () => [...newsKeys.all, 'feed'] as const,
  item: (id: string) => [...newsKeys.all, 'item', id] as const,
};

/**
 * `isSample` is true when the feed comes from the local sample set: either
 * Supabase is not configured or the news migration has not been applied yet.
 * The screen uses it to show the "contenido de muestra" banner.
 */
export type NewsFeed = {
  items: FeedItem[];
  isSample: boolean;
};

const FEED_LIMIT = 60;

/** Postgres/PostgREST codes for "relation does not exist" and friends. */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache/i.test(error.message ?? '')
  );
}

const KNOWN_TOPICS: readonly ContentTopic[] = [
  'LaLiga',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Champions League',
  'Ligue 1',
  'Mercado',
  'Análisis',
  'Otras ligas',
];

const KNOWN_STATUSES: readonly RumorStatus[] = ['rumor', 'negociando', 'avanzado', 'descartado'];

/** Row shape of `public.news_items`. */
type NewsRow = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  topic: string;
  source_label: string;
  source_url: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
  status: string | null;
  player: string | null;
  club_from: string | null;
  club_from_id: number | null;
  club_to: string | null;
  club_to_id: number | null;
  fee: string | null;
  tags: string[] | null;
};

function crestUrl(teamId: number | null): string | undefined {
  return teamId ? `https://media.api-sports.io/football/teams/${teamId}.png` : undefined;
}

function mapRow(row: NewsRow): FeedItem {
  const topic = KNOWN_TOPICS.includes(row.topic as ContentTopic)
    ? (row.topic as ContentTopic)
    : 'Otras ligas';

  const base = {
    id: row.id,
    title: row.title,
    summary: row.summary,
    topic,
    source: row.source_label,
    sourceUrl: row.source_url,
    imageUrl: row.image_url ?? undefined,
    author: row.author ?? undefined,
    publishedAt: row.published_at,
  };

  if (row.kind === 'rumor') {
    const status = KNOWN_STATUSES.includes(row.status as RumorStatus)
      ? (row.status as RumorStatus)
      : 'rumor';

    return {
      ...base,
      kind: 'rumor',
      status,
      player: row.player,
      from: row.club_from ? { name: row.club_from, logo: crestUrl(row.club_from_id) } : null,
      to: row.club_to ? { name: row.club_to, logo: crestUrl(row.club_to_id) } : null,
      fee: row.fee,
    };
  }

  return { ...base, kind: 'news', tags: row.tags ?? [] };
}

async function selectRows(): Promise<NewsRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NewsRow[];
}

/**
 * Asks the Edge Function for fresh items. It is throttled server-side, so it is
 * safe to call on every pull-to-refresh; failures are ignored on purpose.
 */
export async function refreshNews(): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    await supabase.functions.invoke('news-refresh', { body: {} });
  } catch {
    // Offline, or the function is not deployed yet: keep the cached rows.
  }
}

/** Only one automatic refresh per app session, to avoid a request loop. */
let autoRefreshRequested = false;

export async function getNewsFeed(): Promise<NewsFeed> {
  if (!supabase) {
    return { items: buildFeed(), isSample: true };
  }

  let rows: NewsRow[];

  try {
    rows = await selectRows();
  } catch (error) {
    // The migration has not been applied yet: keep the app usable.
    if (error instanceof Error && isMissingTable({ message: error.message })) {
      return { items: buildFeed(), isSample: true };
    }
    throw error;
  }

  if (rows.length === 0 && !autoRefreshRequested) {
    autoRefreshRequested = true;
    await refreshNews();

    try {
      rows = await selectRows();
    } catch {
      rows = [];
    }
  }

  return { items: rows.map(mapRow), isSample: false };
}

export async function getNewsItem(id: string): Promise<FeedItem | null> {
  if (!supabase) {
    return findFeedItem(buildFeed(), id);
  }

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return findFeedItem(buildFeed(), id);
    }
    throw new Error(error.message);
  }

  return data ? mapRow(data as NewsRow) : null;
}

export function useNewsFeed() {
  return useQuery({
    queryKey: newsKeys.feed(),
    queryFn: getNewsFeed,
    staleTime: CONTENT_STALE_TIME_MS,
  });
}

export function useNewsItem(id: string | null) {
  return useQuery({
    queryKey: newsKeys.item(id ?? 'unknown'),
    queryFn: () => getNewsItem(id as string),
    enabled: id !== null,
    staleTime: CONTENT_STALE_TIME_MS,
  });
}
