export type TeamOption = {
  id: number;
  name: string;
  league: string;
  country: string;
};

/**
 * Curated club list used by the favourite-team picker. It is local data so it
 * costs no API-Football requests on the Free plan. IDs match API-Football, and
 * crests are served from its public media CDN.
 */
export const TEAM_OPTIONS: readonly TeamOption[] = [
  { id: 541, name: 'Real Madrid', league: 'LaLiga', country: 'España' },
  { id: 529, name: 'Barcelona', league: 'LaLiga', country: 'España' },
  { id: 530, name: 'Atlético de Madrid', league: 'LaLiga', country: 'España' },
  { id: 531, name: 'Athletic Club', league: 'LaLiga', country: 'España' },
  { id: 532, name: 'Valencia', league: 'LaLiga', country: 'España' },
  { id: 533, name: 'Villarreal', league: 'LaLiga', country: 'España' },
  { id: 536, name: 'Sevilla', league: 'LaLiga', country: 'España' },
  { id: 543, name: 'Real Betis', league: 'LaLiga', country: 'España' },
  { id: 548, name: 'Real Sociedad', league: 'LaLiga', country: 'España' },
  { id: 547, name: 'Girona', league: 'LaLiga', country: 'España' },

  { id: 50, name: 'Manchester City', league: 'Premier League', country: 'Inglaterra' },
  { id: 33, name: 'Manchester United', league: 'Premier League', country: 'Inglaterra' },
  { id: 40, name: 'Liverpool', league: 'Premier League', country: 'Inglaterra' },
  { id: 42, name: 'Arsenal', league: 'Premier League', country: 'Inglaterra' },
  { id: 49, name: 'Chelsea', league: 'Premier League', country: 'Inglaterra' },
  { id: 47, name: 'Tottenham', league: 'Premier League', country: 'Inglaterra' },
  { id: 34, name: 'Newcastle', league: 'Premier League', country: 'Inglaterra' },

  { id: 157, name: 'Bayern Múnich', league: 'Bundesliga', country: 'Alemania' },
  { id: 165, name: 'Borussia Dortmund', league: 'Bundesliga', country: 'Alemania' },
  { id: 168, name: 'Bayer Leverkusen', league: 'Bundesliga', country: 'Alemania' },
  { id: 173, name: 'RB Leipzig', league: 'Bundesliga', country: 'Alemania' },

  { id: 85, name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'Francia' },
  { id: 81, name: 'Olympique de Marsella', league: 'Ligue 1', country: 'Francia' },
  { id: 80, name: 'Olympique de Lyon', league: 'Ligue 1', country: 'Francia' },
  { id: 91, name: 'Mónaco', league: 'Ligue 1', country: 'Francia' },

  { id: 505, name: 'Inter de Milán', league: 'Serie A', country: 'Italia' },
  { id: 489, name: 'AC Milan', league: 'Serie A', country: 'Italia' },
  { id: 496, name: 'Juventus', league: 'Serie A', country: 'Italia' },
  { id: 492, name: 'Napoli', league: 'Serie A', country: 'Italia' },
  { id: 497, name: 'Roma', league: 'Serie A', country: 'Italia' },

  { id: 211, name: 'Benfica', league: 'Primeira Liga', country: 'Portugal' },
  { id: 212, name: 'Porto', league: 'Primeira Liga', country: 'Portugal' },
  { id: 228, name: 'Sporting de Lisboa', league: 'Primeira Liga', country: 'Portugal' },

  { id: 127, name: 'Flamengo', league: 'Brasileirão', country: 'Brasil' },
  { id: 121, name: 'Palmeiras', league: 'Brasileirão', country: 'Brasil' },
  { id: 435, name: 'River Plate', league: 'Liga Profesional', country: 'Argentina' },
  { id: 451, name: 'Boca Juniors', league: 'Liga Profesional', country: 'Argentina' },
] as const;

export function getTeamLogoUrl(teamId: number): string {
  return `https://media.api-sports.io/football/teams/${teamId}.png`;
}

export function findTeamOption(teamId: number | null): TeamOption | null {
  if (teamId === null) {
    return null;
  }

  return TEAM_OPTIONS.find((team) => team.id === teamId) ?? null;
}

export function filterTeams(query: string): TeamOption[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [...TEAM_OPTIONS];
  }

  return TEAM_OPTIONS.filter(
    (team) =>
      team.name.toLowerCase().includes(normalized) ||
      team.league.toLowerCase().includes(normalized) ||
      team.country.toLowerCase().includes(normalized)
  );
}
