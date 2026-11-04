import { addDays } from 'date-fns';

import { getMatchPhase } from '@/features/matches/mappers';
import { toDateKey } from '@/lib/format';
import type { Fixture } from '@/services/api-football/types';

import { MAX_PREDICTED_GOALS, PREDICTION_WINDOW_DAYS } from './constants';

/**
 * Predictions close at kickoff. The database enforces the same rule in the RLS
 * policies; this helper only decides what the UI shows as editable.
 */
export function isPredictionOpen(kickoffIso: string, now: Date = new Date()): boolean {
  const kickoff = Date.parse(kickoffIso);
  return Number.isFinite(kickoff) && kickoff > now.getTime();
}

/** Local date keys covered by the "Próximos partidos" list: today and after. */
export function predictionWindowDateKeys(
  now: Date = new Date(),
  days: number = PREDICTION_WINDOW_DAYS
): string[] {
  return Array.from({ length: days + 1 }, (_, offset) => toDateKey(addDays(now, offset)));
}

export function isTeamFixture(fixture: Fixture, teamId: number): boolean {
  return fixture.teams.home.id === teamId || fixture.teams.away.id === teamId;
}

/**
 * Matches of the favourite team that can still be predicted: not started and
 * kicking off in the future, sorted by kickoff.
 */
export function getPredictableFixtures(
  fixtures: readonly Fixture[],
  teamId: number | null,
  now: Date = new Date()
): Fixture[] {
  if (teamId === null) {
    return [];
  }

  return fixtures
    .filter(
      (fixture) =>
        isTeamFixture(fixture, teamId) &&
        getMatchPhase(fixture) === 'scheduled' &&
        isPredictionOpen(fixture.fixture.date, now)
    )
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
}

/** Keeps a score inside the range accepted by the database. */
export function clampGoals(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(MAX_PREDICTED_GOALS, Math.max(0, Math.round(value)));
}
