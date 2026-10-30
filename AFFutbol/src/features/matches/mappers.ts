import type { Fixture, FixtureStatusShort } from '@/services/api-football/types';

import { formatMatchTime } from '@/lib/format';

export type MatchPhase = 'scheduled' | 'live' | 'finished' | 'postponed';

const LIVE_STATUSES = new Set<FixtureStatusShort>(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED_STATUSES = new Set<FixtureStatusShort>(['FT', 'AET', 'PEN']);
const POSTPONED_STATUSES = new Set<FixtureStatusShort>([
  'PST',
  'CANC',
  'ABD',
  'AWD',
  'WO',
  'SUSP',
]);

export function getMatchPhase(fixture: Fixture): MatchPhase {
  const status = fixture.fixture.status.short;

  if (FINISHED_STATUSES.has(status)) return 'finished';
  if (LIVE_STATUSES.has(status)) return 'live';
  if (POSTPONED_STATUSES.has(status)) return 'postponed';
  return 'scheduled';
}

export function isLiveMatch(fixture: Fixture) {
  return getMatchPhase(fixture) === 'live';
}

export function isFinishedMatch(fixture: Fixture) {
  return getMatchPhase(fixture) === 'finished';
}

export function hasScore(fixture: Fixture) {
  return fixture.goals.home !== null && fixture.goals.away !== null;
}

/** `67'`, `Descanso`, `Prórroga`... only for live matches. */
export function getLiveMinuteLabel(fixture: Fixture): string {
  const { short, elapsed } = fixture.fixture.status;

  switch (short) {
    case 'HT':
      return 'Descanso';
    case 'BT':
      return 'Descanso (pr.)';
    case 'P':
      return 'Penaltis';
    case 'ET':
      return 'Prórroga';
    case 'INT':
      return 'Interrumpido';
    default:
      return elapsed === null ? 'En directo' : `${elapsed}'`;
  }
}

/** Short label for the finished/postponed states. */
export function getMatchPhaseLabel(fixture: Fixture): string {
  const { short } = fixture.fixture.status;

  switch (short) {
    case 'FT':
      return 'Final';
    case 'AET':
      return 'Final (pr.)';
    case 'PEN':
      return 'Final (pen.)';
    case 'PST':
      return 'Aplazado';
    case 'CANC':
      return 'Cancelado';
    case 'ABD':
      return 'Abandonado';
    case 'AWD':
      return 'Decidido';
    case 'WO':
      return 'Incomparecencia';
    case 'SUSP':
      return 'Suspendido';
    case 'TBD':
      return 'Por confirmar';
    default:
      return formatMatchTime(fixture.fixture.date);
  }
}

/** Label for the status column of a match row. */
export function getMatchStatusLabel(fixture: Fixture): string {
  const phase = getMatchPhase(fixture);
  return phase === 'live' ? getLiveMinuteLabel(fixture) : getMatchPhaseLabel(fixture);
}

export function getPenaltyScore(fixture: Fixture): { home: number; away: number } | null {
  const { home, away } = fixture.score.penalty;
  if (home === null || away === null) return null;
  return { home, away };
}
