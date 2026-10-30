import { useQuery } from '@tanstack/react-query';

import { CONTENT_STALE_TIME_MS } from './constants';
import { buildFeed, findFeedItem } from './feed';
import type { FeedItem } from './types';

export const newsKeys = {
  all: ['news'] as const,
  feed: () => [...newsKeys.all, 'feed'] as const,
  item: (id: string) => [...newsKeys.all, 'item', id] as const,
};

/**
 * Phase 2 reads curated sample content. When Supabase (or a news API) is
 * wired up, replace these two functions; screens and cache keys stay the same.
 */
export async function getNewsFeed(): Promise<FeedItem[]> {
  return buildFeed();
}

export async function getNewsItem(id: string): Promise<FeedItem | null> {
  return findFeedItem(buildFeed(), id);
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
