/**
 * Maps an API-Football `/fixtures?date=` payload to the shape of the
 * `public.fixtures` cache table, which feeds the match reminder.
 *
 * Pure: no Deno globals, no network, covered by Jest.
 */

export type CachedFixture = {
  fixture_id: number;
  league_id: number | null;
  league_name: string | null;
  league_logo: string | null;
  league_country: string | null;
  home_team_id: number;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_id: number;
  away_team_name: string;
  away_team_logo: string | null;
  /** ISO timestamp of the kickoff. */
  kickoff_at: string;
  status_short: string;
  season: number | null;
};

type RawTeam = { id?: unknown; name?: unknown; logo?: unknown };

type RawFixture = {
  fixture?: { id?: unknown; date?: unknown; status?: { short?: unknown } };
  league?: {
    id?: unknown;
    name?: unknown;
    logo?: unknown;
    country?: unknown;
    season?: unknown;
  };
  teams?: { home?: RawTeam; away?: RawTeam };
};

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function normalizeFixture(raw: unknown): CachedFixture | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const fixture = (raw as RawFixture).fixture;
  const teams = (raw as RawFixture).teams;
  const league = (raw as RawFixture).league;

  const fixtureId = readNumber(fixture?.id);
  const kickoff = readText(fixture?.date);
  const statusShort = readText(fixture?.status?.short);
  const homeId = readNumber(teams?.home?.id);
  const awayId = readNumber(teams?.away?.id);
  const homeName = readText(teams?.home?.name);
  const awayName = readText(teams?.away?.name);

  if (
    fixtureId === null ||
    !kickoff ||
    !statusShort ||
    homeId === null ||
    awayId === null ||
    !homeName ||
    !awayName
  ) {
    return null;
  }

  const kickoffDate = new Date(kickoff);

  if (Number.isNaN(kickoffDate.getTime())) {
    return null;
  }

  return {
    fixture_id: fixtureId,
    league_id: readNumber(league?.id),
    league_name: readText(league?.name),
    league_logo: readText(league?.logo),
    league_country: readText(league?.country),
    home_team_id: homeId,
    home_team_name: homeName,
    home_team_logo: readText(teams?.home?.logo),
    away_team_id: awayId,
    away_team_name: awayName,
    away_team_logo: readText(teams?.away?.logo),
    kickoff_at: kickoffDate.toISOString(),
    status_short: statusShort,
    season: readNumber(league?.season),
  };
}

/** Reads `response[]` from an API-Football payload, dropping malformed items. */
export function normalizeFixtures(payload: unknown): CachedFixture[] {
  const response =
    payload && typeof payload === 'object'
      ? (payload as { response?: unknown }).response
      : undefined;

  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .map(normalizeFixture)
    .filter((fixture): fixture is CachedFixture => fixture !== null);
}

/** Matches still waiting to start: the only ones worth a reminder. */
export function isScheduled(fixture: Pick<CachedFixture, 'status_short'>): boolean {
  return fixture.status_short === 'NS';
}
