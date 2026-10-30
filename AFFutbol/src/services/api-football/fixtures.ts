/**
 * Endpoints we use from API-Football.
 *
 * The free plan only allows date-based fixture queries and fixture ids, so we
 * never request league seasons. When `EXPO_PUBLIC_USE_MOCKS` is enabled (or no
 * API key is present) the same data is served from local mocks.
 */

import { env } from '@/lib/env';
import { getDeviceTimeZone } from '@/lib/timezone';

import { apiFootballRequest } from './client';
import {
  getMockFixtureById,
  getMockFixtureEvents,
  getMockFixtureLineups,
  getMockFixtureStatistics,
  getMockFixturesByDate,
} from './mocks-data';
import type {
  Fixture,
  FixtureEvent,
  FixtureLineup,
  FixtureTeamStatistics,
} from './types';

/** All fixtures of a local date (`yyyy-MM-dd`). One request returns the whole day. */
export async function getFixturesByDate(dateKey: string): Promise<Fixture[]> {
  if (env.useMocks) {
    return getMockFixturesByDate(dateKey);
  }

  const fixtures = await apiFootballRequest<Fixture[]>('/fixtures', {
    date: dateKey,
    timezone: getDeviceTimeZone(),
  });
  return fixtures ?? [];
}

export async function getFixtureById(id: number): Promise<Fixture | null> {
  if (env.useMocks) {
    return getMockFixtureById(id);
  }

  const fixtures = await apiFootballRequest<Fixture[]>('/fixtures', {
    id,
    timezone: getDeviceTimeZone(),
  });
  return fixtures[0] ?? null;
}

export async function getFixtureEvents(id: number): Promise<FixtureEvent[]> {
  if (env.useMocks) {
    return getMockFixtureEvents(id);
  }

  const events = await apiFootballRequest<FixtureEvent[]>('/fixtures/events', {
    fixture: id,
  });
  return events ?? [];
}

export async function getFixtureLineups(id: number): Promise<FixtureLineup[]> {
  if (env.useMocks) {
    return getMockFixtureLineups(id);
  }

  const lineups = await apiFootballRequest<FixtureLineup[]>('/fixtures/lineups', {
    fixture: id,
  });
  return lineups ?? [];
}

export async function getFixtureStatistics(id: number): Promise<FixtureTeamStatistics[]> {
  if (env.useMocks) {
    return getMockFixtureStatistics(id);
  }

  const statistics = await apiFootballRequest<FixtureTeamStatistics[]>(
    '/fixtures/statistics',
    { fixture: id }
  );
  return statistics ?? [];
}
