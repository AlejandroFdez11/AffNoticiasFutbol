import { useQuery } from '@tanstack/react-query';

import { LEAGUE_SNAPSHOTS } from './data';
import { resolveLeagueSnapshot } from './logic';
import type { LeagueId, LeagueSnapshot } from './types';

/** Sample data does not change while the app is open. */
export const STATISTICS_STALE_TIME_MS = Infinity;

export const statisticsKeys = {
  all: ['statistics'] as const,
  league: (id: LeagueId) => [...statisticsKeys.all, 'league', id] as const,
};

/**
 * Phase 2 returns a curated sample table.
 *
 * API-Football's free plan rejects league+season queries outside 2022–2024, so
 * live standings/scorers are not available yet. When the plan changes, replace
 * this function with `apiFootballRequest('/standings', { league, season })`
 * (and `/players/topscorers`) mapped into `StoredLeagueSnapshot`; the screen and
 * cache keys stay untouched.
 */
export async function getLeagueSnapshot(id: LeagueId): Promise<LeagueSnapshot> {
  return resolveLeagueSnapshot(LEAGUE_SNAPSHOTS[id]);
}

export function useLeagueSnapshot(id: LeagueId) {
  return useQuery({
    queryKey: statisticsKeys.league(id),
    queryFn: () => getLeagueSnapshot(id),
    staleTime: STATISTICS_STALE_TIME_MS,
  });
}
