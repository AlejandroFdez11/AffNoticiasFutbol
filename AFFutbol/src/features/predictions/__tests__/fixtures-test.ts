import { makeFixture } from '@/features/matches/__mocks__/match-fixture';

import {
  clampGoals,
  getPredictableFixtures,
  isPredictionOpen,
  isTeamFixture,
  predictionWindowDateKeys,
} from '../fixtures';

const NOW = new Date(2026, 10, 5, 12, 0, 0);

describe('isPredictionOpen', () => {
  it('opens the prediction until kickoff', () => {
    expect(isPredictionOpen(new Date(2026, 10, 5, 13, 0, 0).toISOString(), NOW)).toBe(true);
    expect(isPredictionOpen(new Date(2026, 10, 5, 11, 59, 59).toISOString(), NOW)).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(isPredictionOpen('not-a-date', NOW)).toBe(false);
  });
});

describe('predictionWindowDateKeys', () => {
  it('covers today and the configured days ahead', () => {
    expect(predictionWindowDateKeys(NOW, 2)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
  });
});

describe('isTeamFixture', () => {
  const fixture = makeFixture({ id: 1, leagueId: 140 });

  it('matches the home and away team', () => {
    expect(isTeamFixture(fixture, fixture.teams.home.id)).toBe(true);
    expect(isTeamFixture(fixture, fixture.teams.away.id)).toBe(true);
    expect(isTeamFixture(fixture, 99999)).toBe(false);
  });
});

describe('getPredictableFixtures', () => {
  const teamId = 1401;

  it('keeps only future scheduled matches of the team', () => {
    const future = makeFixture({
      id: 1,
      leagueId: 140,
      timestamp: new Date(2026, 10, 6, 20, 0, 0).getTime(),
    });
    const past = makeFixture({
      id: 2,
      leagueId: 140,
      timestamp: new Date(2026, 10, 4, 20, 0, 0).getTime(),
    });
    const finished = makeFixture({
      id: 3,
      leagueId: 140,
      status: 'FT',
      timestamp: new Date(2026, 10, 6, 20, 0, 0).getTime(),
      goals: { home: 1, away: 0 },
    });
    const otherTeam = makeFixture({
      id: 4,
      leagueId: 141,
      timestamp: new Date(2026, 10, 6, 20, 0, 0).getTime(),
    });

    expect(getPredictableFixtures([past, finished, otherTeam, future], teamId, NOW)).toEqual([
      future,
    ]);
  });

  it('returns nothing without a favourite team', () => {
    expect(getPredictableFixtures([], null, NOW)).toEqual([]);
  });

  it('sorts matches by kickoff', () => {
    const later = makeFixture({
      id: 1,
      leagueId: 140,
      timestamp: new Date(2026, 10, 7, 20, 0, 0).getTime(),
    });
    const sooner = makeFixture({
      id: 2,
      leagueId: 140,
      timestamp: new Date(2026, 10, 6, 20, 0, 0).getTime(),
    });

    expect(getPredictableFixtures([later, sooner], teamId, NOW)).toEqual([sooner, later]);
  });
});

describe('clampGoals', () => {
  it('keeps scores inside the database range', () => {
    expect(clampGoals(-3)).toBe(0);
    expect(clampGoals(7.6)).toBe(8);
    expect(clampGoals(30)).toBe(20);
    expect(clampGoals(Number.NaN)).toBe(0);
  });
});
