import { makeFixture } from '../__mocks__/match-fixture';
import { FEATURED_LEAGUE_IDS, filterFixturesByLeague, isFeaturedLeague } from '../league-filter';

describe('featured league filter', () => {
  it('allows every competition in the curated list', () => {
    for (const leagueId of FEATURED_LEAGUE_IDS) {
      expect(isFeaturedLeague(leagueId)).toBe(true);
    }
  });

  it('rejects youth, women, lower divisions and other competitions', () => {
    const excluded = [11, 15, 38, 41, 44, 63, 80, 138, 475, 541, 667, 850];

    for (const leagueId of excluded) {
      expect(isFeaturedLeague(leagueId)).toBe(false);
    }
  });

  it('keeps only featured fixtures without changing their order', () => {
    const fixtures = [
      makeFixture({ id: 1, leagueId: 39 }),
      makeFixture({ id: 2, leagueId: 38 }),
      makeFixture({ id: 3, leagueId: 71 }),
      makeFixture({ id: 4, leagueId: 11 }),
      makeFixture({ id: 5, leagueId: 13 }),
    ];

    expect(filterFixturesByLeague(fixtures).map((fixture) => fixture.fixture.id)).toEqual([
      1, 3, 5,
    ]);
  });

  it('returns an empty list when there are no fixtures', () => {
    expect(filterFixturesByLeague([])).toEqual([]);
  });
});
