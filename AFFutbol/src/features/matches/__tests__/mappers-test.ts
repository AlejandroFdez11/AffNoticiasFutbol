import { makeFixture } from '../__mocks__/match-fixture';
import {
  getLiveMinuteLabel,
  getMatchPhase,
  getMatchPhaseLabel,
  getMatchStatusLabel,
  getPenaltyScore,
  hasScore,
  isFinishedMatch,
  isLiveMatch,
} from '../mappers';

describe('match status mapping', () => {
  it.each([
    ['FT', 'finished'],
    ['AET', 'finished'],
    ['PEN', 'finished'],
    ['NS', 'scheduled'],
    ['TBD', 'scheduled'],
    ['1H', 'live'],
    ['HT', 'live'],
    ['2H', 'live'],
    ['ET', 'live'],
    ['P', 'live'],
    ['PST', 'postponed'],
    ['CANC', 'postponed'],
    ['SUSP', 'postponed'],
  ] as const)('maps %s to %s', (status, phase) => {
    const fixture = makeFixture({ id: 1, leagueId: 1, status });

    expect(getMatchPhase(fixture)).toBe(phase);
    expect(isLiveMatch(fixture)).toBe(phase === 'live');
    expect(isFinishedMatch(fixture)).toBe(phase === 'finished');
  });

  it('formats live minutes and breaks', () => {
    expect(getLiveMinuteLabel(makeFixture({ id: 1, leagueId: 1, status: '2H' }))).toBe("60'");
    expect(getLiveMinuteLabel(makeFixture({ id: 1, leagueId: 1, status: 'HT' }))).toBe('Descanso');
    expect(getLiveMinuteLabel(makeFixture({ id: 1, leagueId: 1, status: 'P' }))).toBe('Penaltis');
  });

  it('formats finished and postponed labels', () => {
    expect(getMatchPhaseLabel(makeFixture({ id: 1, leagueId: 1, status: 'FT' }))).toBe('Final');
    expect(getMatchPhaseLabel(makeFixture({ id: 1, leagueId: 1, status: 'AET' }))).toBe(
      'Final (pr.)'
    );
    expect(getMatchPhaseLabel(makeFixture({ id: 1, leagueId: 1, status: 'PEN' }))).toBe(
      'Final (pen.)'
    );
    expect(getMatchPhaseLabel(makeFixture({ id: 1, leagueId: 1, status: 'PST' }))).toBe('Aplazado');
    expect(getMatchPhaseLabel(makeFixture({ id: 1, leagueId: 1, status: 'CANC' }))).toBe(
      'Cancelado'
    );
  });

  it('shows the kickoff time for scheduled matches', () => {
    const fixture = makeFixture({ id: 1, leagueId: 1, status: 'NS' });

    expect(getMatchStatusLabel(fixture)).toBe('21:00');
  });

  it('knows when a score is available', () => {
    expect(hasScore(makeFixture({ id: 1, leagueId: 1 }))).toBe(false);
    expect(
      hasScore(makeFixture({ id: 1, leagueId: 1, goals: { home: 2, away: 1 } }))
    ).toBe(true);
  });

  it('reads penalty shootout scores only when available', () => {
    const fixture = makeFixture({ id: 1, leagueId: 1, status: 'PEN' });
    expect(getPenaltyScore(fixture)).toBeNull();

    fixture.score.penalty = { home: 4, away: 3 };
    expect(getPenaltyScore(fixture)).toEqual({ home: 4, away: 3 });
  });
});
