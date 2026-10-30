import type { Fixture, FixtureLeague } from '@/services/api-football/types';

import { isLiveMatch } from './mappers';

export type LeagueGroup = {
  league: FixtureLeague;
  matches: Fixture[];
  liveCount: number;
};

function byKickoff(a: Fixture, b: Fixture) {
  return a.fixture.timestamp - b.fixture.timestamp || a.fixture.id - b.fixture.id;
}

export function sortFixturesByKickoff(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort(byKickoff);
}

export function getLiveFixtures(fixtures: Fixture[]): Fixture[] {
  return sortFixturesByKickoff(fixtures.filter(isLiveMatch));
}

/**
 * Groups fixtures by league, sorted with live competitions first and then by
 * country/league name.
 */
export function groupFixturesByLeague(fixtures: Fixture[]): LeagueGroup[] {
  const groups = new Map<number, LeagueGroup>();

  for (const fixture of fixtures) {
    const existing = groups.get(fixture.league.id);

    if (existing) {
      existing.matches.push(fixture);
      if (isLiveMatch(fixture)) existing.liveCount += 1;
      continue;
    }

    groups.set(fixture.league.id, {
      league: fixture.league,
      matches: [fixture],
      liveCount: isLiveMatch(fixture) ? 1 : 0,
    });
  }

  return Array.from(groups.values())
    .map((group) => ({ ...group, matches: sortFixturesByKickoff(group.matches) }))
    .sort((a, b) => {
      if (a.liveCount !== b.liveCount) return b.liveCount - a.liveCount;
      const byCountry = a.league.country.localeCompare(b.league.country, 'es');
      if (byCountry !== 0) return byCountry;
      return a.league.name.localeCompare(b.league.name, 'es');
    });
}

export function countLiveMatches(fixtures: Fixture[]): number {
  return fixtures.reduce((total, fixture) => total + (isLiveMatch(fixture) ? 1 : 0), 0);
}
