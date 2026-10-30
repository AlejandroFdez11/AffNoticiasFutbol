/**
 * News and transfer-rumour domain types.
 *
 * Phase 2 serves curated sample content from `data.ts`. The shapes are already
 * the ones a future Supabase table (or a news API) should return, so swapping
 * the query functions in `api.ts` will not touch the screens.
 */

export type ContentTopic =
  | 'LaLiga'
  | 'Premier League'
  | 'Serie A'
  | 'Bundesliga'
  | 'Champions League'
  | 'Mercado'
  | 'Análisis';

type ContentBase = {
  id: string;
  kind: ContentKind;
  title: string;
  summary: string;
  body: string[];
  topic: ContentTopic;
  source: string;
  /** Used to derive a fresh-looking `publishedAt` on every fetch. */
  publishedHoursAgo: number;
};

export type ContentKind = 'news' | 'rumor';

export type NewsArticle = ContentBase & {
  kind: 'news';
  author: string;
  readingMinutes: number;
  tags: string[];
  featured?: boolean;
};

export type RumorStatus = 'rumor' | 'negociando' | 'avanzado' | 'descartado';

export type RumorClub = {
  name: string;
  logo?: string;
};

export type TransferRumor = ContentBase & {
  kind: 'rumor';
  player: string;
  position: string;
  age: number;
  from: RumorClub;
  to: RumorClub;
  fee: string;
  /** Confidence in the operation, 0–100. */
  probability: number;
  status: RumorStatus;
};

export type ContentItem = NewsArticle | TransferRumor;

/** Content with a concrete publication date, ready to render. */
export type FeedItem = ContentItem & { publishedAt: string };
export type FeedArticle = NewsArticle & { publishedAt: string };
export type FeedRumor = TransferRumor & { publishedAt: string };

export type NewsFilter = 'all' | 'news' | 'rumor';
