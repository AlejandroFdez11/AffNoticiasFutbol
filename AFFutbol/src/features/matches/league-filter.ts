import type { Fixture } from '@/services/api-football/types';

/**
 * Competitions shown in the matches feed.
 *
 * API-Football's free plan only lets us fetch fixtures by date, so the whole
 * day is requested once and filtered on the device. Keep this list in sync
 * with the competitions the product wants to show.
 */
export const FEATURED_LEAGUE_IDS = [
  // England: Premier League, Championship, FA Cup, League Cup, Community Shield
  39, 40, 45, 48, 528,
  // Spain: LaLiga, Segunda División, Copa del Rey, Supercopa
  140, 141, 143, 556,
  // Italy: Serie A, Serie B, Coppa Italia, Supercoppa
  135, 136, 137, 547,
  // Germany: Bundesliga, 2. Bundesliga, DFB Pokal, Supercup
  78, 79, 81, 529,
  // France: Ligue 1, Ligue 2, Coupe de France, Trophée des Champions
  61, 62, 66, 526,
  // UEFA club competitions
  2, 3, 848, 531,
  // Brazil: Serie A, Serie B, Copa do Brasil, Supercopa do Brasil
  71, 72, 73, 632,
  // Argentina: Liga Profesional, Primera Nacional, Copa Argentina, Supercopa, Trofeo de Campeones
  128, 129, 130, 810, 517,
  // CONMEBOL Libertadores
  13,
  // National teams: World Cup, Euro, Nations League, AFCON, Asian Cup, Copa América,
  // Gold Cup, friendlies, World Cup qualifiers, Euro qualifiers, CONCACAF Nations League,
  // Gold Cup qualifiers, OFC Nations Cup and Finalissima.
  1, 4, 5, 6, 7, 9, 10, 22, 29, 30, 31, 32, 33, 34, 35, 36, 37, 536, 806, 808, 858, 913,
  960,
] as const;

const featuredLeagueIds = new Set<number>(FEATURED_LEAGUE_IDS);

export function isFeaturedLeague(leagueId: number) {
  return featuredLeagueIds.has(leagueId);
}

export function filterFixturesByLeague(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((fixture) => isFeaturedLeague(fixture.league.id));
}
