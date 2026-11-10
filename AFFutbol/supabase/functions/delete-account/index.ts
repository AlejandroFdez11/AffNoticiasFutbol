/**
 * `delete-account` — permanently deletes the account of the calling user.
 *
 * Apple requires any app that lets people create an account to let them delete
 * it from inside the app (App Store Review Guideline 5.1.1(v)). The app cannot
 * do this with the anon key: removing a row from `auth.users` is only possible
 * with the service role, so it lives here.
 *
 * The request must carry the user's JWT. The function resolves the user from
 * that token (never from the body) and then calls the Admin API. One delete is
 * enough: every table that stores user data declares
 * `references auth.users (id) on delete cascade`:
 *
 *   profiles, predictions, league_members, leagues (owned), push_tokens,
 *   notification_preferences, push_deliveries, ranking_state
 *
 * Deploy:  npx supabase functions deploy delete-account
 * JWT verification stays ON (`verify_jwt = true` in supabase/config.toml), so
 * the gateway already rejects anonymous requests; the token is verified again
 * here because the gateway only checks that it is a JWT of this project.
 *
 * Body:    { "confirm": "ELIMINAR" }
 * Returns: { "deleted": true }
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

import { parseDeletionRequest } from '../_shared/account-deletion.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 ? token : null;
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  // An empty body is not "confirm everything": read it as text first so a
  // malformed payload answers 400 instead of reaching the Admin API.
  let body: unknown;

  try {
    const text = await request.text();
    body = text.trim() ? JSON.parse(text) : null;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = parseDeletionRequest(body);

  if (!parsed.ok) {
    return json({ error: 'Confirmation required', reason: parsed.reason }, 400);
  }

  const token = readBearerToken(request);

  if (!token) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // `getUser(token)` validates the signature, the expiry and the subject of the
  // caller's JWT. The id comes from Supabase, never from the request body, so a
  // user can only delete their own account.
  const { data: userData, error: userError } = await admin.auth.getUser(token);

  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);

  if (deleteError) {
    console.error('delete-account failed', deleteError.message);
    return json({ error: 'Could not delete the account' }, 500);
  }

  return json({ deleted: true });
});
