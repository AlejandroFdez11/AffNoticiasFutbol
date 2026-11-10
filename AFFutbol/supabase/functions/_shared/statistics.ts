/**
 * Statistics snapshot helpers shared by the `sync-statistics` Edge Function and
 * the Jest suite.
 *
 * Rules for this file: no Deno globals, no Node built-ins and no network. It
 * only transforms already-fetched data, so the same code runs in the Supabase
 * runtime and in Jest. Everything here is deterministic.
 *
 * The stored payload mirrors `src/features/statistics/types.ts` on purpose (the
 * client keeps its own copy so Metro never reaches into `supabase/`); the JSON
 * shape is the contract between both sides.
 *
 * Keeping the football-data.org mapper in this file too is deliberate: a local
 * `import ... from './other.ts'` is valid in Deno but rejected by `tsc` unless
 * `allowImportingTsExtensions` is on, and these modules are type-checked
 * through their Jest tests.
 */

export type LeagueId = 'laliga' | 'premier' | 'seriea' | 'bundesliga';

export type FormResult = 'W' | 'D' | 'L';

export type TeamRef = {
  name: string;
  /** Compact label for tight UI (tables). `name` stays the matching key. */
  shortName?: string;
  logo?: string;
};

export type StandingRow = {
  team: TeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Last five results, oldest first. */
  form: FormResult[];
};

export type ScorerRow = {
  player: string;
  team: TeamRef;
  goals: number;
  /** Not available from the free sources; the UI hides the column. */
  assists?: number;
  matches?: number;
};

export type LeagueInfo = {
  id: LeagueId;
  name: string;
  shortName: string;
  country: string;
  logo: string;
  season: string;
};

export type StoredLeagueSnapshot = {
  league: LeagueInfo;
  standings: StandingRow[];
  scorers: ScorerRow[];
};

/** What the Wikipedia parser returns: goals only, crests are resolved later. */
export type ParsedScorer = {
  player: string;
  team: { name: string };
  goals: number;
};

export type SnapshotInput = {
  league: LeagueInfo;
  standings: StandingRow[];
  scorers: readonly ParsedScorer[];
};

// ---------------------------------------------------------------------------
// football-data.org standings
// ---------------------------------------------------------------------------

export type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

export type FootballDataTableRow = {
  position: number;
  team: FootballDataTeam;
  playedGames: number;
  form?: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference?: number;
};

export type FootballDataStanding = {
  stage?: string;
  type: string;
  group?: string | null;
  table: FootballDataTableRow[];
};

export type FootballDataSeason = {
  startDate?: string | null;
  endDate?: string | null;
};

export type FootballDataStandingsResponse = {
  season?: FootballDataSeason | null;
  standings?: FootballDataStanding[];
};

const FORM_RESULTS: readonly FormResult[] = ['W', 'D', 'L'];

/**
 * `form` arrives as `"W,D,L,W,W"`, oldest first, which is exactly what
 * `StandingRow.form` expects. If football-data.org ever flips the order, this
 * is the single place to change.
 */
export function parseForm(form: string | null | undefined): FormResult[] {
  if (!form) return [];

  return form
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is FormResult => (FORM_RESULTS as readonly string[]).includes(value))
    .slice(-5);
}

/**
 * `"2026-08-15"` / `"2027-05-24"` -> `"2026/27"`. Returns `null` when the
 * response does not carry a usable season, so the caller can fall back.
 */
export function formatSeason(season: FootballDataSeason | null | undefined): string | null {
  const start = season?.startDate?.slice(0, 4);
  const end = season?.endDate?.slice(2, 4);

  if (!start || !end || start.length !== 4 || end.length !== 2) return null;

  return `${start}/${end}`;
}

/**
 * Turns the `standings` array of the API response into our stored rows.
 *
 * `name` keeps the full official name because the scorers table is matched
 * against it: football-data's short names are nicknames ("Barça", "Atleti") that
 * no Wikipedia table uses. `shortName` travels next to it only for display, so
 * the standings table can stay compact.
 */
export function mapStandings(response: FootballDataStandingsResponse): StandingRow[] {
  const table = response.standings?.find((standing) => standing.type === 'TOTAL')?.table ?? [];

  return table.map((row) => ({
    team: {
      name: row.team.name,
      ...(row.team.shortName ? { shortName: row.team.shortName } : {}),
      logo: row.team.crest ?? undefined,
    },
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    points: row.points,
    form: parseForm(row.form),
  }));
}

// ---------------------------------------------------------------------------
// Club name matching
// ---------------------------------------------------------------------------

/**
 * Club suffixes and particles that carry no identity. Dropping them lets
 * "FC Barcelona" match "Barcelona" and "Real Racing Club de Santander" match
 * "Racing Santander" without a table per league.
 */
const CLUB_STOPWORDS = new Set([
  '1',
  'ac',
  'acf',
  'afc',
  'as',
  'balompie',
  'ca',
  'calcio',
  'cf',
  'cfc',
  'club',
  'de',
  'del',
  'fc',
  'la',
  'las',
  'los',
  'rc',
  'rcd',
  'sad',
  'sd',
  'ss',
  'ssc',
  'the',
  'ud',
]);

/**
 * Wikipedia and football-data.org do not always agree on a club name. Only the
 * cases that normalization cannot bridge are listed; anything missing simply
 * renders the team initial instead of a crest.
 */
const CLUB_ALIASES: Record<string, string> = {
  'bayern munich': 'bayern munchen',
  'deportivo a coruna': 'deportivo coruna',
  hamburg: 'hamburger',
  inter: 'internazionale milano',
  'nottm forest': 'nottingham forest',
  wolves: 'wolverhampton wanderers',
};

/**
 * Lowercase, unaccented, punctuation-free club name with the generic suffixes
 * removed. `&` becomes `and` so "Brighton & Hove Albion" and
 * "Brighton and Hove Albion" collapse to the same key.
 */
export function normalizeClubName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 0 && !CLUB_STOPWORDS.has(token))
    .join(' ')
    .trim();
}

/** Whole-word containment, so "inter" never matches "internazionale". */
function containsPhrase(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `);
}

/**
 * Builds a club name -> crest resolver from the standings of the same league.
 * Standings already carry a football-data.org crest per team, so the scorers
 * table needs no second name mapping table of its own.
 */
export function buildCrestLookup(
  standings: readonly StandingRow[]
): (club: string) => string | undefined {
  const byName = new Map<string, string>();

  for (const row of standings) {
    if (!row.team.logo) continue;

    const key = normalizeClubName(row.team.name);
    if (key) byName.set(key, row.team.logo);
  }

  return (club) => {
    const key = normalizeClubName(club);
    if (!key) return undefined;

    const direct = byName.get(key) ?? byName.get(CLUB_ALIASES[key] ?? '');
    if (direct) return direct;

    for (const [candidate, logo] of byName) {
      if (containsPhrase(candidate, key) || containsPhrase(key, candidate)) {
        return logo;
      }
    }

    return undefined;
  };
}

/**
 * Combines a fresh fetch with the stored snapshot.
 *
 * Both sources fail independently: football-data.org can rate-limit us and
 * Wikipedia can change its table format. A failed side keeps the previous data
 * instead of blanking the screen, and crests are resolved after the merge so a
 * reused standings table still decorates the new scorers.
 */
export function mergeSnapshot(
  previous: StoredLeagueSnapshot | null,
  input: SnapshotInput
): StoredLeagueSnapshot {
  const standings = input.standings.length > 0 ? input.standings : (previous?.standings ?? []);
  const lookup = buildCrestLookup(standings);

  const scorers: ScorerRow[] =
    input.scorers.length > 0
      ? input.scorers.map((scorer) => {
          const logo = lookup(scorer.team.name);

          return {
            player: scorer.player,
            team: logo ? { name: scorer.team.name, logo } : { name: scorer.team.name },
            goals: scorer.goals,
          };
        })
      : (previous?.scorers ?? []);

  return {
    league: input.league,
    standings,
    scorers,
  };
}

/**
 * Season label the app displays (`2026/27`). European leagues start in July, so
 * August onwards belongs to the season that starts that year.
 */
export function currentSeason(date: Date): string {
  const year = date.getUTCFullYear();
  const start = date.getUTCMonth() >= 6 ? year : year - 1;
  const end = (start + 1) % 100;

  return `${start}/${String(end).padStart(2, '0')}`;
}
