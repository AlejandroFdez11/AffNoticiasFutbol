import {
  isScheduled,
  normalizeFixture,
  normalizeFixtures,
} from '../../../../supabase/functions/_shared/fixture-cache';

const rawFixture = {
  fixture: {
    id: 1234,
    date: '2026-11-05T19:00:00+00:00',
    status: { short: 'NS', long: 'Not Started' },
  },
  league: {
    id: 140,
    name: 'La Liga',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    country: 'Spain',
    season: 2026,
  },
  teams: {
    home: {
      id: 90,
      name: 'Betis',
      logo: 'https://media.api-sports.io/football/teams/90.png',
    },
    away: {
      id: 536,
      name: 'Sevilla',
      logo: 'https://media.api-sports.io/football/teams/536.png',
    },
  },
};

describe('normalizeFixture', () => {
  it('maps an API-Football fixture to the cache columns', () => {
    expect(normalizeFixture(rawFixture)).toEqual({
      fixture_id: 1234,
      league_id: 140,
      league_name: 'La Liga',
      league_logo: 'https://media.api-sports.io/football/leagues/140.png',
      league_country: 'Spain',
      home_team_id: 90,
      home_team_name: 'Betis',
      home_team_logo: 'https://media.api-sports.io/football/teams/90.png',
      away_team_id: 536,
      away_team_name: 'Sevilla',
      away_team_logo: 'https://media.api-sports.io/football/teams/536.png',
      kickoff_at: '2026-11-05T19:00:00.000Z',
      status_short: 'NS',
      season: 2026,
    });
  });

  it('keeps optional league fields empty', () => {
    const minimal = {
      fixture: rawFixture.fixture,
      teams: rawFixture.teams,
    };

    expect(normalizeFixture(minimal)).toMatchObject({
      league_id: null,
      league_name: null,
      season: null,
    });
  });

  it('drops fixtures without id, teams or a valid date', () => {
    expect(normalizeFixture(null)).toBeNull();
    expect(normalizeFixture({})).toBeNull();

    expect(
      normalizeFixture({
        ...rawFixture,
        fixture: { ...rawFixture.fixture, date: 'no-date' },
      })
    ).toBeNull();

    expect(
      normalizeFixture({ ...rawFixture, teams: { home: rawFixture.teams.home } })
    ).toBeNull();
  });
});

describe('normalizeFixtures', () => {
  it('reads the response array and drops malformed items', () => {
    const fixtures = normalizeFixtures({
      get: 'fixtures',
      response: [rawFixture, {}, rawFixture],
    });

    expect(fixtures).toHaveLength(2);
    expect(fixtures.map((fixture) => fixture.fixture_id)).toEqual([1234, 1234]);
  });

  it('returns an empty list for unexpected payloads', () => {
    expect(normalizeFixtures(null)).toEqual([]);
    expect(normalizeFixtures({ response: 'nope' })).toEqual([]);
  });
});

describe('isScheduled', () => {
  it('only accepts matches that have not started', () => {
    expect(isScheduled({ status_short: 'NS' })).toBe(true);
    expect(isScheduled({ status_short: '1H' })).toBe(false);
    expect(isScheduled({ status_short: 'FT' })).toBe(false);
  });
});
