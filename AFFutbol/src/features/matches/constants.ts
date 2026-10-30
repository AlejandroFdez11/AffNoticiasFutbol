/** Tunables for the matches feature. */

/** Freshness of a day of fixtures. Today changes often, past days never do. */
export const MATCHES_STALE_TIME_MS = 5 * 60_000;

/** A finished match only changes on rare corrections. */
export const FINISHED_MATCH_STALE_TIME_MS = 24 * 60 * 60_000;

/**
 * Automatic live polling is disabled on purpose: the API-Football free plan
 * allows 100 requests/day. Pull-to-refresh keeps the score fresh instead.
 */
export const LIVE_REFETCH_INTERVAL_MS = 0;

/** Days shown on each side of today in the date strip. */
export const DATE_STRIP_RADIUS = 7;

/** Fixture lists over this size start with all league sections collapsed. */
export const AUTO_EXPAND_THRESHOLD = 12;

/** Spanish labels for the statistics returned by the API. */
export const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Posesión',
  'Total Shots': 'Tiros',
  'Shots on Goal': 'Tiros a puerta',
  'Shots off Goal': 'Tiros fuera',
  'Blocked Shots': 'Tiros bloqueados',
  'Shots insidebox': 'Tiros dentro del área',
  'Shots outsidebox': 'Tiros fuera del área',
  'Corner Kicks': 'Córners',
  Fouls: 'Faltas',
  'Yellow Cards': 'Amarillas',
  'Red Cards': 'Rojas',
  Offsides: 'Fueras de juego',
  'Goalkeeper Saves': 'Paradas',
  'Total passes': 'Pases',
  'Passes accurate': 'Pases completados',
  'Passes %': 'Precisión de pase',
  expected_goals: 'Goles esperados (xG)',
};

export const MATCH_TABS = [
  { key: 'summary', label: 'Resumen' },
  { key: 'lineups', label: 'Alineaciones' },
  { key: 'statistics', label: 'Estadísticas' },
] as const;

export type MatchTabKey = (typeof MATCH_TABS)[number]['key'];
