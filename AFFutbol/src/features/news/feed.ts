import { ARTICLES, RUMORS } from './data';
import type { ContentItem, FeedItem, NewsFilter } from './types';

const HOUR_MS = 60 * 60_000;

/** Turns the editorial `publishedHoursAgo` offset into a concrete ISO date. */
export function resolvePublishedAt(hoursAgo: number, now = Date.now()): string {
  return new Date(now - Math.max(0, hoursAgo) * HOUR_MS).toISOString();
}

/** Adds `publishedAt` and sorts newest first, with ties broken by id. */
export function resolveFeedItems(items: readonly ContentItem[], now = Date.now()): FeedItem[] {
  return items
    .map((item) => ({ ...item, publishedAt: resolvePublishedAt(item.publishedHoursAgo, now) }))
    .sort(
      (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)
    );
}

export function buildFeed(now = Date.now()): FeedItem[] {
  return resolveFeedItems([...ARTICLES, ...RUMORS], now);
}

export function filterFeed(items: readonly FeedItem[], filter: NewsFilter): FeedItem[] {
  if (filter === 'all') return [...items];
  return items.filter((item) => item.kind === filter);
}

export function findFeedItem(items: readonly FeedItem[], id: string): FeedItem | null {
  return items.find((item) => item.id === id) ?? null;
}
