import { ARTICLES, RUMORS, type SampleItem } from './data';
import type { FeedItem, NewsFilter } from './types';

const HOUR_MS = 60 * 60_000;

/** Turns the editorial `publishedHoursAgo` offset into a concrete ISO date. */
export function resolvePublishedAt(hoursAgo: number, now = Date.now()): string {
  return new Date(now - Math.max(0, hoursAgo) * HOUR_MS).toISOString();
}

/** Sample content carries an editorial offset; the UI only needs a real date. */
export function toFeedItem(sample: SampleItem, now = Date.now()): FeedItem {
  const base = {
    id: sample.id,
    title: sample.title,
    summary: sample.summary,
    topic: sample.topic,
    source: sample.source,
    publishedAt: resolvePublishedAt(sample.publishedHoursAgo, now),
    body: sample.body,
  };

  return sample.kind === 'rumor'
    ? {
        ...base,
        kind: 'rumor',
        status: sample.status,
        player: sample.player,
        from: sample.from,
        to: sample.to,
        fee: sample.fee,
      }
    : {
        ...base,
        kind: 'news',
        author: sample.author,
        tags: sample.tags,
        featured: sample.featured,
      };
}

/** Adds `publishedAt` and sorts newest first, with ties broken by id. */
export function resolveFeedItems(samples: readonly SampleItem[], now = Date.now()): FeedItem[] {
  return samples
    .map((sample) => toFeedItem(sample, now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
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
