import type {
  LeagueSnapshot,
  LeagueSummary,
  PositionedStanding,
  ScorerRow,
  StandingRow,
  StoredLeagueSnapshot,
} from './types';

function compareTeams(
  a: { team: { name: string } },
  b: { team: { name: string } }
) {
  return a.team.name.localeCompare(b.team.name, 'es');
}

/**
 * Label for the tight tables: football-data.org ships a compact `shortName`
 * ("Barça", "Atleti") next to the full official name, which is what the club
 * matching uses. Scorers have no short name, so they keep their Wikipedia name.
 */
export function teamLabel(team: { name: string; shortName?: string }): string {
  return team.shortName ?? team.name;
}

/**
 * Orders a table with the same criteria used in football: points, goal
 * difference, goals scored and finally the team name to keep the result stable.
 */
export function buildStandings(rows: readonly StandingRow[]): PositionedStanding[] {
  return rows
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        compareTeams(a, b)
    )
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function sortScorers(rows: readonly ScorerRow[]): ScorerRow[] {
  return [...rows].sort(
    (a, b) =>
      b.goals - a.goals ||
      (b.assists ?? 0) - (a.assists ?? 0) ||
      a.player.localeCompare(b.player, 'es')
  );
}

export function buildLeagueSummary(standings: readonly PositionedStanding[]): LeagueSummary {
  if (standings.length === 0) {
    throw new Error('A league snapshot needs at least one standing row.');
  }

  const matches = standings.reduce((total, row) => total + row.played, 0) / 2;
  const goals = standings.reduce((total, row) => total + row.goalsFor, 0);

  const bestAttack = [...standings].sort(
    (a, b) => b.goalsFor - a.goalsFor || compareTeams(a, b)
  )[0];
  const bestDefense = [...standings].sort(
    (a, b) => a.goalsAgainst - b.goalsAgainst || compareTeams(a, b)
  )[0];

  return {
    matches,
    goals,
    goalsPerMatch: matches > 0 ? goals / matches : 0,
    leader: standings[0],
    bestAttack,
    bestDefense,
  };
}

/** Turns a stored snapshot into the fully resolved table the screens render. */
export function resolveLeagueSnapshot(
  snapshot: StoredLeagueSnapshot,
  isSample = false
): LeagueSnapshot {
  const standings = buildStandings(snapshot.standings);

  return {
    league: snapshot.league,
    standings,
    scorers: sortScorers(snapshot.scorers),
    summary: buildLeagueSummary(standings),
    isSample,
  };
}
