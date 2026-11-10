/**
 * `api-football` — narrow proxy for API-Football (v3).
 *
 * The phone never sees the API key: it POSTs `{ path, params }` here and this
 * function adds `x-apisports-key` server-side. That lets us rotate or upgrade
 * the key without shipping a new build, and keeps the key out of the bundle.
 *
 * It is not an open relay: `_shared/api-football-proxy.ts` only allows the
 * endpoints and parameters the app actually uses (`/fixtures` by date or id and
 * the per-fixture `events`, `lineups` and `statistics`), so a leaked anon key
 * cannot be turned into arbitrary API-Football traffic.
 *
 * Deploy (JWT verification stays ON, so only a valid anon key can call it):
 *   npx supabase functions deploy api-football
 *
 * Secret (server only, never `EXPO_PUBLIC_*`). The same name is already used by
 * `settle-predictions` and `send-push`, so one value serves all three:
 *   npx supabase secrets set API_FOOTBALL_KEY=...
 *
 * The app opts in with `EXPO_PUBLIC_API_FOOTBALL_PROXY_URL`:
 *   https://<project-ref>.supabase.co/functions/v1/api-football
 *
 * Body: `{ "path": "/fixtures", "params": { "date": "2026-11-10", "timezone": "Europe/Madrid" } }`
 * The upstream envelope (`get`, `parameters`, `errors`, `results`, `paging`,
 * `response`) is forwarded untouched so the client keeps its error mapping.
 */

import {
  buildUpstreamUrl,
  parseProxyRequest,
} from '../_shared/api-football-proxy.ts';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const UPSTREAM_TIMEOUT_MS = 15_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method-not-allowed', message: 'Usa POST.' }, 405);
  }

  const key = Deno.env.get('API_FOOTBALL_KEY')?.trim();

  if (!key) {
    return json({ error: 'missing-key', message: 'Falta el secreto API_FOOTBALL_KEY.' }, 500);
  }

  // Read the body as text first: an unparseable body must fail loudly instead of
  // being treated as "no params" and forwarded upstream.
  const rawBody = await request.text();
  let body: unknown = null;

  if (rawBody.trim().length > 0) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: 'invalid-json', message: 'El cuerpo no es JSON válido.' }, 400);
    }
  }

  const parsed = parseProxyRequest(body);

  if (!parsed.ok) {
    return json({ error: parsed.code, message: parsed.message }, 400);
  }

  const url = buildUpstreamUrl(API_FOOTBALL_BASE, parsed.request.path, parsed.request.params);

  let upstream: Response;

  try {
    upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'x-apisports-key': key,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[api-football] upstream failed: ${error instanceof Error ? error.message : error}`);
    return json({ error: 'upstream-unreachable', message: 'API-Football no respondió.' }, 502);
  }

  const payload = await upstream.text();

  if (!upstream.ok) {
    console.error(`[api-football] upstream ${upstream.status} for ${parsed.request.path}`);
  }

  return new Response(payload, {
    status: upstream.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
});
