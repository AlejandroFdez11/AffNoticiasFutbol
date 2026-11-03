import { LEAGUE_IDS, LEAGUE_SNAPSHOTS } from '../data';
import { buildLeagueSummary, buildStandings, resolveLeagueSnapshot, sortScorers } from '../logic';
import type { StandingRow, StoredLeagueSnapshot } from '../types';

function standing(
  name: string,
  won: number,
  drawn: number,
  lost: number,
  goalsFor: number,
  goalsAgainst: number
): StandingRow {
  return {
    team: { name },
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    points: won * 3 + drawn,
    form: [],
  };
}

describe('statistics logic', () => {
  it('sorts by points, goal difference and goals scored, then assigns positions', () => {
    const rows = [
      standing('C', 1, 1, 0, 2, 1),
      standing('A', 1, 1, 0, 5, 2),
      standing('B', 1, 0, 1, 6, 3),
      standing('D', 1, 1, 0, 4, 1),
    ];

    const sorted = buildStandings(rows);

    expect(sorted.map((row) => row.team.name)).toEqual(['A', 'D', 'C', 'B']);
    expect(sorted.map((row) => row.position)).toEqual([1, 2, 3, 4]);
    expect(sorted[0].goalDifference).toBe(3);
  });

  it('does not mutate the input standings', () => {
    const rows = [standing('B', 0, 1, 1, 1, 2), standing('A', 2, 0, 0, 4, 1)];
    const original = rows.map((row) => row.team.name);

    buildStandings(rows);

    expect(rows.map((row) => row.team.name)).toEqual(original);
    expect(rows.some((row) => 'position' in row)).toBe(false);
  });

  it('summarises matches, goals and the competition leaders', () => {
    const standings = buildStandings([
      standing('A', 2, 0, 0, 5, 2),
      standing('B', 1, 0, 1, 3, 0),
      standing('C', 0, 0, 2, 2, 8),
    ]);
    const summary = buildLeagueSummary(standings);

    expect(summary.matches).toBe(3);
    expect(summary.goals).toBe(10);
    expect(summary.goalsPerMatch).toBeCloseTo(10 / 3);
    expect(summary.leader.team.name).toBe('A');
    expect(summary.bestAttack.team.name).toBe('A');
    expect(summary.bestDefense.team.name).toBe('B');
  });

  it('resolves a stored snapshot without mutating it', () => {
    const snapshot: StoredLeagueSnapshot = {
      league: {
        id: 'laliga',
        name: 'LaLiga',
        shortName: 'LaLiga',
        country: 'España',
        logo: '',
        season: '2026/27',
      },
      standings: [
        standing('B', 0, 1, 1, 1, 2),
        standing('A', 2, 0, 0, 4, 1),
      ],
      scorers: [
        { player: 'Z', team: { name: 'B' }, goals: 1, assists: 0, matches: 2 },
        { player: 'A', team: { name: 'A' }, goals: 3, assists: 1, matches: 2 },
      ],
    };
    const original = snapshot.standings.map((row) => row.team.name);

    const resolved = resolveLeagueSnapshot(snapshot);

    expect(resolved.standings.map((row) => row.position)).toEqual([1, 2]);
    expect(resolved.standings[0].team.name).toBe('A');
    expect(resolved.scorers.map((scorer) => scorer.player)).toEqual(['A', 'Z']);
    expect(snapshot.standings.map((row) => row.team.name)).toEqual(original);
  });

  it('sorts scorers by goals, assists and name', () => {
    const sorted = sortScorers([
      { player: 'B', team: { name: 'X' }, goals: 2, assists: 1, matches: 5 },
      { player: 'C', team: { name: 'X' }, goals: 2, assists: 3, matches: 5 },
      { player: 'A', team: { name: 'X' }, goals: 4, assists: 0, matches: 5 },
    ]);

    expect(sorted.map((scorer) => scorer.player)).toEqual(['A', 'C', 'B']);
  });

  it('ships consistent sample snapshots for every league', () => {
    for (const id of LEAGUE_IDS) {
      const snapshot = LEAGUE_SNAPSHOTS[id];
      const resolved = resolveLeagueSnapshot(snapshot);

      expect(resolved.standings).toHaveLength(10);
      expect(resolved.standings.map((row) => row.position)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
      expect(resolved.scorers).toHaveLength(5);

      for (const row of resolved.standings) {
        expect(row.played).toBe(row.won + row.drawn + row.lost);
        expect(row.points).toBe(row.won * 3 + row.drawn);
      }

      const goals = resolved.scorers.map((scorer) => scorer.goals);
      expect(goals).toEqual([...goals].sort((a, b) => b - a));
    }
  });

  it('rejects an empty table when building a summary', () => {
    expect(() => buildLeagueSummary([])).toThrow();
  });
});
