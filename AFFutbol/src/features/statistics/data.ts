import type { FormResult, LeagueId, StoredLeagueSnapshot, StandingRow } from './types';

const teamLogo = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;
const leagueLogo = (leagueId: number) =>
  `https://media.api-sports.io/football/leagues/${leagueId}.png`;

const SEASON = '2026/27';

function standing(
  name: string,
  teamId: number,
  won: number,
  drawn: number,
  lost: number,
  goalsFor: number,
  goalsAgainst: number,
  form: FormResult[]
): StandingRow {
  return {
    team: { name, logo: teamLogo(teamId) },
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    points: won * 3 + drawn,
    form,
  };
}

const team = (name: string, teamId: number) => ({ name, logo: teamLogo(teamId) });

/**
 * Sample standings and scorers, clearly labelled as demo data in the UI.
 * The numbers are internally consistent (played = W + D + L, points = 3W + D)
 * and sorted by the same rules the real API uses.
 */
export const LEAGUE_SNAPSHOTS: Record<LeagueId, StoredLeagueSnapshot> = {
  laliga: {
    league: {
      id: 'laliga',
      name: 'LaLiga',
      shortName: 'LaLiga',
      country: 'España',
      logo: leagueLogo(140),
      season: SEASON,
    },
    standings: [
      standing('Real Madrid', 541, 9, 1, 1, 24, 8, ['W', 'W', 'W', 'D', 'W']),
      standing('Barcelona', 529, 8, 1, 2, 27, 12, ['W', 'L', 'W', 'W', 'W']),
      standing('Atlético de Madrid', 530, 7, 2, 2, 19, 9, ['W', 'D', 'W', 'W', 'L']),
      standing('Villarreal', 533, 6, 3, 2, 20, 12, ['W', 'W', 'D', 'L', 'W']),
      standing('Athletic Club', 531, 5, 4, 2, 15, 10, ['D', 'W', 'D', 'W', 'D']),
      standing('Real Betis', 543, 5, 3, 3, 16, 13, ['W', 'L', 'W', 'D', 'W']),
      standing('Real Sociedad', 548, 4, 3, 4, 13, 12, ['L', 'W', 'D', 'L', 'W']),
      standing('Sevilla FC', 536, 4, 2, 5, 12, 15, ['L', 'W', 'L', 'W', 'L']),
      standing('Girona', 547, 3, 3, 5, 14, 18, ['D', 'L', 'W', 'L', 'D']),
      standing('Valencia', 532, 2, 4, 5, 10, 16, ['L', 'D', 'L', 'D', 'W']),
    ],
    scorers: [
      { player: 'Kylian Mbappé', team: team('Real Madrid', 541), goals: 12, assists: 2, matches: 11 },
      { player: 'Robert Lewandowski', team: team('Barcelona', 529), goals: 9, assists: 2, matches: 10 },
      { player: 'Antoine Griezmann', team: team('Atlético de Madrid', 530), goals: 8, assists: 3, matches: 11 },
      { player: 'Ayoze Pérez', team: team('Villarreal', 533), goals: 7, assists: 2, matches: 11 },
      { player: 'Vinícius Jr.', team: team('Real Madrid', 541), goals: 6, assists: 4, matches: 9 },
    ],
  },
  premier: {
    league: {
      id: 'premier',
      name: 'Premier League',
      shortName: 'Premier',
      country: 'Inglaterra',
      logo: leagueLogo(39),
      season: SEASON,
    },
    standings: [
      standing('Arsenal', 42, 8, 2, 1, 22, 7, ['W', 'W', 'D', 'W', 'W']),
      standing('Liverpool', 40, 7, 3, 1, 24, 11, ['W', 'D', 'W', 'W', 'D']),
      standing('Manchester City', 50, 7, 1, 3, 23, 12, ['L', 'W', 'W', 'W', 'W']),
      standing('Chelsea', 49, 6, 3, 2, 19, 10, ['W', 'D', 'W', 'L', 'W']),
      standing('Tottenham', 47, 6, 2, 3, 18, 13, ['W', 'W', 'L', 'D', 'W']),
      standing('Newcastle', 34, 5, 3, 3, 17, 14, ['D', 'W', 'W', 'L', 'D']),
      standing('Aston Villa', 66, 4, 4, 3, 15, 13, ['D', 'W', 'D', 'W', 'L']),
      standing('Manchester United', 33, 4, 2, 5, 13, 16, ['L', 'W', 'L', 'W', 'L']),
      standing('Brighton', 51, 3, 4, 4, 12, 15, ['D', 'L', 'D', 'W', 'L']),
      standing('West Ham', 48, 3, 2, 6, 11, 19, ['L', 'L', 'W', 'D', 'L']),
    ],
    scorers: [
      { player: 'Erling Haaland', team: team('Manchester City', 50), goals: 13, assists: 1, matches: 11 },
      { player: 'Mohamed Salah', team: team('Liverpool', 40), goals: 10, assists: 4, matches: 11 },
      { player: 'Bukayo Saka', team: team('Arsenal', 42), goals: 8, assists: 5, matches: 10 },
      { player: 'Cole Palmer', team: team('Chelsea', 49), goals: 7, assists: 3, matches: 11 },
      { player: 'Alexander Isak', team: team('Newcastle', 34), goals: 6, assists: 1, matches: 9 },
    ],
  },
  seriea: {
    league: {
      id: 'seriea',
      name: 'Serie A',
      shortName: 'Serie A',
      country: 'Italia',
      logo: leagueLogo(135),
      season: SEASON,
    },
    standings: [
      standing('Inter', 505, 9, 1, 1, 23, 8, ['W', 'W', 'W', 'D', 'W']),
      standing('Napoli', 492, 7, 3, 1, 20, 9, ['W', 'D', 'W', 'W', 'D']),
      standing('Juventus', 496, 6, 4, 1, 18, 8, ['D', 'W', 'W', 'D', 'W']),
      standing('Milan', 489, 6, 3, 2, 17, 11, ['W', 'L', 'W', 'D', 'W']),
      standing('Roma', 497, 5, 4, 2, 14, 9, ['D', 'W', 'D', 'W', 'W']),
      standing('Atalanta', 499, 5, 3, 3, 18, 14, ['W', 'W', 'L', 'D', 'L']),
      standing('Lazio', 487, 4, 4, 3, 12, 11, ['D', 'L', 'W', 'D', 'W']),
      standing('Fiorentina', 502, 4, 3, 4, 11, 12, ['L', 'W', 'D', 'L', 'W']),
      standing('Bologna', 500, 3, 4, 4, 10, 13, ['D', 'L', 'D', 'W', 'L']),
      standing('Torino', 503, 2, 4, 5, 8, 15, ['L', 'D', 'L', 'D', 'L']),
    ],
    scorers: [
      { player: 'Marcus Thuram', team: team('Inter', 505), goals: 10, assists: 3, matches: 11 },
      { player: 'Romelu Lukaku', team: team('Napoli', 492), goals: 8, assists: 2, matches: 10 },
      { player: 'Dušan Vlahović', team: team('Juventus', 496), goals: 7, assists: 1, matches: 10 },
      { player: 'Rafael Leão', team: team('Milan', 489), goals: 6, assists: 3, matches: 11 },
      { player: 'Ademola Lookman', team: team('Atalanta', 499), goals: 5, assists: 2, matches: 9 },
    ],
  },
  bundesliga: {
    league: {
      id: 'bundesliga',
      name: 'Bundesliga',
      shortName: 'Bundes',
      country: 'Alemania',
      logo: leagueLogo(78),
      season: SEASON,
    },
    standings: [
      standing('Bayern München', 157, 9, 1, 1, 32, 9, ['W', 'W', 'W', 'W', 'D']),
      standing('Bayer Leverkusen', 168, 7, 3, 1, 24, 12, ['W', 'D', 'W', 'D', 'W']),
      standing('Borussia Dortmund', 165, 6, 3, 2, 21, 13, ['W', 'W', 'D', 'L', 'W']),
      standing('RB Leipzig', 173, 6, 2, 3, 19, 14, ['L', 'W', 'W', 'D', 'W']),
      standing('Stuttgart', 172, 5, 3, 3, 17, 15, ['W', 'L', 'D', 'W', 'D']),
      standing('Eintracht Frankfurt', 169, 4, 4, 3, 16, 14, ['D', 'W', 'D', 'L', 'W']),
      standing('Freiburg', 160, 4, 2, 5, 13, 16, ['L', 'D', 'W', 'L', 'L']),
      standing('Wolfsburg', 161, 3, 4, 4, 12, 16, ['D', 'L', 'D', 'W', 'L']),
      standing('Werder Bremen', 134, 3, 2, 6, 11, 19, ['L', 'W', 'L', 'L', 'W']),
      standing('Union Berlin', 182, 2, 3, 6, 9, 20, ['L', 'L', 'D', 'D', 'L']),
    ],
    scorers: [
      { player: 'Harry Kane', team: team('Bayern München', 157), goals: 14, assists: 3, matches: 11 },
      { player: 'Serhou Guirassy', team: team('Borussia Dortmund', 165), goals: 9, assists: 2, matches: 10 },
      { player: 'Patrik Schick', team: team('Bayer Leverkusen', 168), goals: 8, assists: 1, matches: 10 },
      { player: 'Loïs Openda', team: team('RB Leipzig', 173), goals: 7, assists: 3, matches: 11 },
      { player: 'Deniz Undav', team: team('Stuttgart', 172), goals: 6, assists: 2, matches: 10 },
    ],
  },
};

export const LEAGUE_IDS = Object.keys(LEAGUE_SNAPSHOTS) as LeagueId[];
