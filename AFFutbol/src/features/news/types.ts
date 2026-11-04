/**
 * News and transfer-rumour domain types.
 *
 * Live content comes from the `news_items` table, which the `news-refresh`
 * Edge Function fills from Spanish RSS feeds. `data.ts` keeps a small curated
 * set for development when Supabase is not configured.
 *
 * We only store and show a headline, a short excerpt and a link back to the
 * outlet: the article body is never republished.
 */

export type ContentTopic =
  | 'LaLiga'
  | 'Premier League'
  | 'Serie A'
  | 'Bundesliga'
  | 'Champions League'
  | 'Ligue 1'
  | 'Mercado'
  | 'Análisis'
  | 'Otras ligas';

export type ContentKind = 'news' | 'rumor';

export type RumorStatus = 'rumor' | 'negociando' | 'avanzado' | 'descartado';

export type RumorClub = {
  name: string;
  logo?: string;
};

type FeedBase = {
  id: string;
  title: string;
  summary: string;
  topic: ContentTopic;
  /** Outlet name, always shown as attribution. */
  source: string;
  /** Canonical URL of the original article. */
  sourceUrl?: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
};

export type FeedArticle = FeedBase & {
  kind: 'news';
  tags: string[];
  featured?: boolean;
  /** Only present in the local sample content; live items link out instead. */
  body?: string[];
};

export type FeedRumor = FeedBase & {
  kind: 'rumor';
  status: RumorStatus;
  /** Derived from the headline; `null` when it could not be identified. */
  player: string | null;
  from: RumorClub | null;
  to: RumorClub | null;
  fee: string | null;
  body?: string[];
};

export type FeedItem = FeedArticle | FeedRumor;

export type NewsFilter = 'all' | 'news' | 'rumor';
