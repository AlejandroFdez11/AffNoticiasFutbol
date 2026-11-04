/**
 * `settle-predictions` — closes pending predictions with the final score.
 *
 * The client can never write `status` or `points` (see the predictions
 * migration), so results are applied here, with the service role:
 *
 *   1. find fixtures with pending predictions that already kicked off
 *   2. ask API-Football for the fixture (`fixtures?id=`)
 *   3. FT/AET/PEN -> `settle_fixture()`, postponed/cancelled -> `void_fixture()`
 *
 * Deploy:
 *   npx supabase functions deploy settle-predictions
 *
 * Secrets (server only, never `EXPO_PUBLIC_*`):
 *   npx supabase secrets set API_FOOTBALL_KEY=... PREDICTIONS_SETTLE_SECRET=...
 *
 * Call it on a schedule (Supabase Cron, GitHub Actions, etc.):
 *   curl -X POST https://<project-ref>.supabase.co/functions/v1/settle-predictions \
 *     -H "x-settle-secret: $PREDICTIONS_SETTLE_SECRET"
 *
 * Body `{ "fixtureId": 1234 }` settles a single match, handy for testing.
 *
 * Quota: every pending fixture is one API-Football request, so the function
 * caps the batch (`MAX_FIXTURES`) to protect the Free plan's 100 requests/day.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

import { decideSettlement, readFixtureResult, type FixtureResult } from '../_shared/settle.ts';

const BASE_URL = 'https://v3.football.api-sports.io';
const MAX_FIXTURES = 100;
const FETCH_TIMEOUT_MS = 15_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-settle-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PendingRow = { fixture_id: number };

type Outcome = {
  fixtureId: number;
  action: 'settle' | 'void' | 'wait' | 'error';
  status?: string;
  error?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

async function fetchResult(fixtureId: number, apiKey: string): Promise<FixtureResult | null> {
  const response = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
    headers: { 'x-apisports-key': apiKey },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`API-Football HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { response?: unknown };
  return readFixtureResult(payload.response);
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('PREDICTIONS_SETTLE_SECRET');

  if (!secret) {
    return json({ error: 'Missing PREDICTIONS_SETTLE_SECRET' }, 500);
  }

  if (request.headers.get('x-settle-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('API_FOOTBALL_KEY');

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  if (!apiKey) {
    return json({ error: 'Missing API_FOOTBALL_KEY secret' }, 500);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let requestedFixtureId: number | null = null;

  try {
    const body = (await request.json()) as { fixtureId?: unknown } | null;

    if (typeof body?.fixtureId === 'number') {
      requestedFixtureId = body.fixtureId;
    }
  } catch {
    // Empty body: settle every pending fixture.
  }

  let fixtureIds: number[];

  if (requestedFixtureId !== null) {
    fixtureIds = [requestedFixtureId];
  } else {
    const { data, error } = await supabase
      .from('predictions')
      .select('fixture_id')
      .eq('status', 'pending')
      .lt('kickoff_at', new Date().toISOString())
      .order('kickoff_at', { ascending: true })
      .limit(MAX_FIXTURES * 5);

    if (error) {
      return json({ error: error.message }, 500);
    }

    fixtureIds = [
      ...new Set(((data ?? []) as PendingRow[]).map((row) => row.fixture_id)),
    ].slice(0, MAX_FIXTURES);
  }

  const outcomes: Outcome[] = [];
  let settled = 0;
  let voided = 0;
  let waiting = 0;

  for (const fixtureId of fixtureIds) {
    try {
      const result = await fetchResult(fixtureId, apiKey);

      if (!result) {
        waiting += 1;
        outcomes.push({ fixtureId, action: 'wait', error: 'Fixture not found' });
        continue;
      }

      const decision = decideSettlement(result);

      if (decision.action === 'settle') {
        const { error } = await supabase.rpc('settle_fixture', {
          p_fixture_id: fixtureId,
          p_home_goals: decision.homeGoals,
          p_away_goals: decision.awayGoals,
        });

        if (error) {
          throw new Error(error.message);
        }

        settled += 1;
      } else if (decision.action === 'void') {
        const { error } = await supabase.rpc('void_fixture', { p_fixture_id: fixtureId });

        if (error) {
          throw new Error(error.message);
        }

        voided += 1;
      } else {
        waiting += 1;
      }

      outcomes.push({ fixtureId, action: decision.action, status: result.status });
    } catch (caught) {
      outcomes.push({
        fixtureId,
        action: 'error',
        error: caught instanceof Error ? caught.message : String(caught),
      });
    }
  }

  return json({
    checkedAt: new Date().toISOString(),
    checked: fixtureIds.length,
    settled,
    voided,
    waiting,
    outcomes,
  });
});
