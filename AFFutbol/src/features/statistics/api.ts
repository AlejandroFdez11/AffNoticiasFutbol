import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/features/auth/supabase';

import { LEAGUE_SNAPSHOTS } from './data';
import { resolveLeagueSnapshot } from './logic';
import type { LeagueId, LeagueSnapshot, StoredLeagueSnapshot } from './types';

/**
 * The stored snapshot is refreshed twice a day by the `sync-statistics` cron,
 * so half an hour of cache keeps the screen instant while switching leagues
 * without serving yesterday's table all session.
 */
export const STATISTICS_STALE_TIME_MS = 30 * 60_000;

export const statisticsKeys = {
  all: ['statistics'] as const,
  league: (id: LeagueId) => [...statisticsKeys.all, 'league', id] as const,
};

/** Postgres/PostgREST codes for "relation does not exist" and friends. */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache/i.test(error.message ?? '')
  );
}

/**
 * Reads the snapshot written by the `sync-statistics` Edge Function.
 *
 * Returns `null` when Supabase is not configured, the migration has not been
 * applied yet or the league has no row, so the caller can serve the bundled
 * sample without showing an error. Real network errors are thrown: the screen
 * already has a retry state for those.
 */
async function fetchStoredSnapshot(id: LeagueId): Promise<StoredLeagueSnapshot | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('statistics_snapshots')
    .select('payload')
    .eq('league_id', id)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return (data?.payload as StoredLeagueSnapshot | undefined) ?? null;
}

/**
 * Real standings and scorers, refreshed twice a day from football-data.org and
 * Wikipedia. When that is not available the curated sample snapshot is served
 * instead and `isSample` lets the screen say so.
 */
export async function getLeagueSnapshot(id: LeagueId): Promise<LeagueSnapshot> {
  const stored = await fetchStoredSnapshot(id);

  if (stored && stored.standings.length > 0) {
    return resolveLeagueSnapshot(stored);
  }

  return resolveLeagueSnapshot(LEAGUE_SNAPSHOTS[id], true);
}

export function useLeagueSnapshot(id: LeagueId) {
  return useQuery({
    queryKey: statisticsKeys.league(id),
    queryFn: () => getLeagueSnapshot(id),
    staleTime: STATISTICS_STALE_TIME_MS,
  });
}
