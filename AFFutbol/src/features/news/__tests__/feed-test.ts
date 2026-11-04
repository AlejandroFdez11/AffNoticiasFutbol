import { ARTICLES, RUMORS } from '../data';
import { buildFeed, filterFeed, findFeedItem, resolvePublishedAt } from '../feed';

const NOW = Date.UTC(2026, 9, 30, 12, 0, 0);

describe('news feed', () => {
  it('resolves publication dates from the editorial hour offset', () => {
    expect(resolvePublishedAt(2, NOW)).toBe('2026-10-30T10:00:00.000Z');
    expect(resolvePublishedAt(0, NOW)).toBe('2026-10-30T12:00:00.000Z');
  });

  it('merges articles and rumours newest first', () => {
    const feed = buildFeed(NOW);

    expect(feed).toHaveLength(ARTICLES.length + RUMORS.length);

    const timestamps = feed.map((item) => Date.parse(item.publishedAt));
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    expect(feed[0].id).toBe('derbi-betis-sevilla');
  });

  it('filters by content kind without mutating the feed', () => {
    const feed = buildFeed(NOW);
    const original = [...feed];

    expect(filterFeed(feed, 'news').every((item) => item.kind === 'news')).toBe(true);
    expect(filterFeed(feed, 'rumor').every((item) => item.kind === 'rumor')).toBe(true);
    expect(filterFeed(feed, 'all')).toHaveLength(feed.length);
    expect(feed).toEqual(original);
  });

  it('finds an item by id and returns null for unknown ids', () => {
    const feed = buildFeed(NOW);

    expect(findFeedItem(feed, 'derbi-betis-sevilla')?.title).toContain('Betis');
    expect(findFeedItem(feed, 'missing')).toBeNull();
  });

  it('keeps ids unique and every rumour carries a status', () => {
    const ids = [...ARTICLES, ...RUMORS].map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const rumor of RUMORS) {
      expect(rumor.status).toBeTruthy();
      expect(rumor.body.length).toBeGreaterThan(0);
    }
  });
});
