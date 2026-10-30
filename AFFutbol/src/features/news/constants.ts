import type { ThemeColor } from '@/constants/theme';

import type { NewsFilter, RumorStatus } from './types';

export const NEWS_FILTERS: readonly { key: NewsFilter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'news', label: 'Noticias' },
  { key: 'rumor', label: 'Rumores' },
];

export const RUMOR_STATUS_META: Record<
  RumorStatus,
  { label: string; color: ThemeColor }
> = {
  rumor: { label: 'Rumor', color: 'textSecondary' },
  negociando: { label: 'En negociación', color: 'accent' },
  avanzado: { label: 'Muy avanzado', color: 'brand' },
  descartado: { label: 'Descartado', color: 'live' },
};

/** Sample content barely changes during a session. */
export const CONTENT_STALE_TIME_MS = 5 * 60_000;
