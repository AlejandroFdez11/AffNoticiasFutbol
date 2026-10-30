import { useQuery } from '@tanstack/react-query';

import {
  getFixtureById,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
  getFixturesByDate,
} from '@/services/api-football/fixtures';

import { FINISHED_MATCH_STALE_TIME_MS, LIVE_REFETCH_INTERVAL_MS, MATCHES_STALE_TIME_MS } from './constants';
import { isFinishedMatch } from './mappers';

export const matchKeys = {
  all: ['matches'] as const,
  byDate: (dateKey: string) => [...matchKeys.all, 'date', dateKey] as const,
  fixture: (id: number) => [...matchKeys.all, 'fixture', id] as const,
  events: (id: number) => [...matchKeys.fixture(id), 'events'] as const,
  lineups: (id: number) => [...matchKeys.fixture(id), 'lineups'] as const,
  statistics: (id: number) => [...matchKeys.fixture(id), 'statistics'] as const,
};

export function useFixturesByDate(dateKey: string) {
  return useQuery({
    queryKey: matchKeys.byDate(dateKey),
    queryFn: () => getFixturesByDate(dateKey),
    staleTime: MATCHES_STALE_TIME_MS,
    // `0` disables polling; see `LIVE_REFETCH_INTERVAL_MS`.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });
}

export function useFixtureDetail(id: number | null) {
  return useQuery({
    queryKey: matchKeys.fixture(id ?? 0),
    queryFn: () => getFixtureById(id as number),
    enabled: id !== null,
    staleTime: (query) => {
      const fixture = query.state.data;
      return fixture && isFinishedMatch(fixture)
        ? FINISHED_MATCH_STALE_TIME_MS
        : MATCHES_STALE_TIME_MS;
    },
  });
}

export function useFixtureEvents(id: number | null, enabled = true) {
  return useQuery({
    queryKey: matchKeys.events(id ?? 0),
    queryFn: () => getFixtureEvents(id as number),
    enabled: id !== null && enabled,
    staleTime: MATCHES_STALE_TIME_MS,
  });
}

export function useFixtureLineups(id: number | null, enabled = true) {
  return useQuery({
    queryKey: matchKeys.lineups(id ?? 0),
    queryFn: () => getFixtureLineups(id as number),
    enabled: id !== null && enabled,
    staleTime: MATCHES_STALE_TIME_MS,
  });
}

export function useFixtureStatistics(id: number | null, enabled = true) {
  return useQuery({
    queryKey: matchKeys.statistics(id ?? 0),
    queryFn: () => getFixtureStatistics(id as number),
    enabled: id !== null && enabled,
    staleTime: MATCHES_STALE_TIME_MS,
  });
}
