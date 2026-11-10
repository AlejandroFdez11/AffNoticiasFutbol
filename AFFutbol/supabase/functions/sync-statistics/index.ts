/**
 * `sync-statistics` — refreshes `public.statistics_snapshots`.
 *
 * The app never talks to football-data.org or Wikipedia: it reads the table
 * through PostgREST. This function is the only writer and runs with the service
 * role, so no key or scraping detail ever reaches the phone.
 *
 * Sources (both free, no paid tier involved):
 *   * football-data.org  `/v4/competitions/{PD,PL,SA,BL1}/standings`
 *     -> positions, points, form and the club crests
 *   * Wikipedia          `action=parse&prop=wikitext` of the season article
 *     -> the "Top goalscorers" table (goals only; assists are not published)
 *
 * Both sources fail independently: if one of them is down or changed its
 * format, `mergeSnapshot` keeps the previous data for that side instead of
 * blanking the screen.
 *
 * Deploy:
 *   npx supabase functions deploy sync-statistics --no-verify-jwt
 *
 * Secrets (server only, never `EXPO_PUBLIC_*`):
 *   npx supabase secrets set FOOTBALL_DATA_TOKEN=... STATISTICS_SYNC_SECRET=...
 *   npx supabase secrets set WIKI_USER_AGENT="AFFutbol/1.0 (statistics sync; +https://affutbol.app)"
 *
 * Manual run (also what the pg_cron job does):
 *   curl -X POST https://<project-ref>.supabase.co/functions/v1/sync-statistics \
 *     -H "x-statistics-secret: $STATISTICS_SYNC_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"dryRun":true}'
 *
 * On PowerShell, keep the body in single quotes: `-d "{\"dryRun\":true}"` sends
 * `{\dryRun:true}` and is rejected with 400.
 *
 * Body: `{ "leagues"?: ["laliga", ...], "dryRun"?: boolean }`. An empty body
 * syncs every league; a malformed body or a `leagues` array with no known id is
 * answered with 400 so a typo can never trigger a real write. `dryRun` fetches
 * and parses but writes nothing, which is the way to check the parser against
 * the live articles.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  currentSeason,
  formatSeason,
  mapStandings,
  mergeSnapshot,
  type FootballDataStandingsResponse,
  type LeagueId,
  type LeagueInfo,
  type StoredLeagueSnapshot,
} from '../_shared/statistics.ts';
import { parseTopScorers, type ParsedScorer } from '../_shared/wikipedia-scorers.ts';

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const FETCH_TIMEOUT_MS = 20_000;
const MAX_SCORERS = 20;
const MAX_PREVIEW = 5;
const DEFAULT_USER_AGENT = 'AFFutbol/1.0 (statistics sync; +https://affutbol.app)';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-statistics-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type LeagueConfig = {
  id: LeagueId;
  /** football-data.org competition code. */
  code: string;
  /** Wikipedia article suffix; the `2026–27_` prefix is added at run time. */
  wikiTitle: string;
  name: string;
  shortName: string;
  country: string;
  /** Public CDN emblem, the same asset the sample snapshot used. */
  logo: string;
};

const leagueLogo = (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`;

const LEAGUES: readonly LeagueConfig[] = [
  {
    id: 'laliga',
    code: 'PD',
    wikiTitle: 'La_Liga',
    name: 'LaLiga',
    shortName: 'LaLiga',
    country: 'España',
    logo: leagueLogo(140),
  },
  {
    id: 'premier',
    code: 'PL',
    wikiTitle: 'Premier_League',
    name: 'Premier League',
    shortName: 'Premier',
    country: 'Inglaterra',
    logo: leagueLogo(39),
  },
  {
    id: 'seriea',
    code: 'SA',
    wikiTitle: 'Serie_A',
    name: 'Serie A',
    shortName: 'Serie A',
    country: 'Italia',
    logo: leagueLogo(135),
  },
  {
    id: 'bundesliga',
    code: 'BL1',
    wikiTitle: 'Bundesliga',
    name: 'Bundesliga',
    shortName: 'Bundes',
    country: 'Alemania',
    logo: leagueLogo(78),
  },
];

type Client = ReturnType<typeof createClient>;

type LeagueResult = {
  id: LeagueId;
  ok: boolean;
  season?: string;
  standings: number;
  scorers: number;
  /** Set when the standings refreshed but the scorer table could not be read. */
  wikiError?: string;
  error?: string;
  preview?: { player: string; team: string; goals: number }[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

/** Wikipedia titles use an en dash: `2026–27_La_Liga`. */
function wikiPage(config: LeagueConfig, season: string): string {
  return `${season.replace('/', '–')}_${config.wikiTitle}`;
}

async function fetchStandings(
  code: string,
  token: string
): Promise<FootballDataStandingsResponse> {
  // No `season` filter: the API returns the running season, which is what the
  // app shows, and it avoids guessing the season start year.
  const response = await fetch(`${FOOTBALL_DATA_BASE}/competitions/${code}/standings`, {
    headers: { 'X-Auth-Token': token },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`football-data.org responded ${response.status} for ${code}`);
  }

  return (await response.json()) as FootballDataStandingsResponse;
}

async function fetchWikitext(page: string, userAgent: string): Promise<string> {
  const url = `${WIKIPEDIA_API}?action=parse&page=${encodeURIComponent(
    page
  )}&prop=wikitext&format=json&formatversion=2`;

  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Wikipedia responded ${response.status} for ${page}`);
  }

  const body = (await response.json()) as { parse?: { wikitext?: string } };

  return body.parse?.wikitext ?? '';
}

async function readSnapshot(client: Client, id: LeagueId): Promise<StoredLeagueSnapshot | null> {
  const { data, error } = await client
    .from('statistics_snapshots')
    .select('payload')
    .eq('league_id', id)
    .maybeSingle();

  if (error) {
    console.warn(`[sync-statistics] cannot read the previous ${id} snapshot: ${error.message}`);
    return null;
  }

  return (data?.payload as StoredLeagueSnapshot | undefined) ?? null;
}

async function syncLeague(args: {
  config: LeagueConfig;
  token: string;
  userAgent: string;
  client: Client;
  dryRun: boolean;
}): Promise<LeagueResult> {
  const { config, token, userAgent, client, dryRun } = args;

  try {
    const response = await fetchStandings(config.code, token);
    const standings = mapStandings(response);

    if (standings.length === 0) {
      throw new Error('football-data.org returned an empty table');
    }

    const season = formatSeason(response.season) ?? currentSeason(new Date());

    let scorers: ParsedScorer[] = [];
    let wikiError: string | undefined;

    try {
      const wikitext = await fetchWikitext(wikiPage(config, season), userAgent);
      scorers = parseTopScorers(wikitext, MAX_SCORERS);

      if (scorers.length === 0) {
        wikiError = 'the scorer table could not be parsed';
      }
    } catch (error) {
      wikiError = error instanceof Error ? error.message : 'Wikipedia request failed';
    }

    const previous = await readSnapshot(client, config.id);
    const league: LeagueInfo = {
      id: config.id,
      name: config.name,
      shortName: config.shortName,
      country: config.country,
      logo: config.logo,
      season,
    };
    const snapshot = mergeSnapshot(previous, { league, standings, scorers });

    if (!dryRun) {
      const { error } = await client.from('statistics_snapshots').upsert(
        {
          league_id: config.id,
          season,
          payload: snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_id' }
      );

      if (error) throw new Error(error.message);
    }

    return {
      id: config.id,
      ok: true,
      season,
      standings: snapshot.standings.length,
      scorers: snapshot.scorers.length,
      ...(wikiError ? { wikiError } : {}),
      ...(dryRun
        ? {
            preview: snapshot.scorers
              .slice(0, MAX_PREVIEW)
              .map((scorer) => ({
                player: scorer.player,
                team: scorer.team.name,
                goals: scorer.goals,
              })),
          }
        : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[sync-statistics] ${config.id} failed: ${message}`);

    return { id: config.id, ok: false, standings: 0, scorers: 0, error: message };
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('STATISTICS_SYNC_SECRET');

  if (!secret) {
    return json({ error: 'Missing STATISTICS_SYNC_SECRET' }, 500);
  }

  if (request.headers.get('x-statistics-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const token = Deno.env.get('FOOTBALL_DATA_TOKEN');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!token) {
    return json({ error: 'Missing FOOTBALL_DATA_TOKEN' }, 500);
  }

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  const userAgent = Deno.env.get('WIKI_USER_AGENT') ?? DEFAULT_USER_AGENT;

  // Read the body as text first: an unparseable body must fail loudly. Treating
  // it as "empty" would silently turn a typo into a real write (`dryRun` lost).
  const rawBody = await request.text();
  let body: { leagues?: unknown; dryRun?: unknown } = {};

  if (rawBody.trim().length > 0) {
    try {
      body = (JSON.parse(rawBody) as { leagues?: unknown; dryRun?: unknown } | null) ?? {};
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
  }

  let requested: LeagueId[] = LEAGUES.map((league) => league.id);

  if (body.leagues !== undefined) {
    const known = new Set<string>(LEAGUES.map((league) => league.id));
    const filtered = Array.isArray(body.leagues)
      ? body.leagues.filter(
          (value): value is LeagueId => typeof value === 'string' && known.has(value)
        )
      : [];

    if (filtered.length === 0) {
      return json({ error: 'No valid leagues in the body', leagues: [...known] }, 400);
    }

    requested = filtered;
  }

  const dryRun = body.dryRun === true;

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const results: LeagueResult[] = [];

  // Sequential on purpose: the free football-data.org tier allows 10 requests
  // per minute and four leagues is nowhere near that, but a burst is pointless.
  for (const config of LEAGUES.filter((league) => requested.includes(league.id))) {
    results.push(await syncLeague({ config, token, userAgent, client, dryRun }));
  }

  return json({
    syncedAt: new Date().toISOString(),
    dryRun,
    ok: results.every((result) => result.ok),
    leagues: results,
  });
});
