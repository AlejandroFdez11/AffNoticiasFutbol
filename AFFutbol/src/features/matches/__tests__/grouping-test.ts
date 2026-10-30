import { makeFixture } from '../__mocks__/match-fixture';
import {
  countLiveMatches,
  getLiveFixtures,
  groupFixturesByLeague,
  sortFixturesByKickoff,
} from '../grouping';

const fixtures = [
  makeFixture({ id: 1, leagueId: 1, timestamp: 1_000_000 }),
  makeFixture({ id: 2, leagueId: 2, country: 'England', timestamp: 500_000, status: '2H' }),
  makeFixture({ id: 3, leagueId: 1, timestamp: 500_000 }),
  makeFixture({ id: 4, leagueId: 3, country: 'Italy', timestamp: 200_000 }),
  makeFixture({
    id: 5,
    leagueId: 2,
    country: 'England',
    timestamp: 900_000,
    status: '1H',
  }),
];

describe('fixture grouping', () => {
  it('sorts fixtures by kickoff without mutating the input', () => {
    const original = [...fixtures];
    const sorted = sortFixturesByKickoff(fixtures);

    expect(sorted.map((fixture) => fixture.fixture.id)).toEqual([4, 2, 3, 5, 1]);
    expect(fixtures).toEqual(original);
  });

  it('returns the live fixtures in kickoff order', () => {
    expect(getLiveFixtures(fixtures).map((fixture) => fixture.fixture.id)).toEqual([2, 5]);
    expect(countLiveMatches(fixtures)).toBe(2);
  });

  it('groups by league with live competitions first and then by country', () => {
    const groups = groupFixturesByLeague(fixtures);

    expect(groups.map((group) => group.league.id)).toEqual([2, 3, 1]);
    expect(groups[0].liveCount).toBe(2);
    expect(groups[0].matches.map((fixture) => fixture.fixture.id)).toEqual([2, 5]);
    expect(groups[1].matches.map((fixture) => fixture.fixture.id)).toEqual([4]);
    expect(groups[2].matches.map((fixture) => fixture.fixture.id)).toEqual([3, 1]);
    expect(groups[2].liveCount).toBe(0);
  });

  it('returns an empty list when there are no fixtures', () => {
    expect(groupFixturesByLeague([])).toEqual([]);
    expect(getLiveFixtures([])).toEqual([]);
    expect(countLiveMatches([])).toBe(0);
  });
});
