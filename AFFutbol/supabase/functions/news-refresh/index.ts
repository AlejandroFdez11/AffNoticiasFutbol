/**
 * `news-refresh` — downloads the configured RSS feeds, normalises them and
 * upserts the result into `public.news_items`.
 *
 * The app never parses XML: it reads the table through PostgREST. This keeps
 * CORS, deduplication, stable ids and caching in one place, and means a feed
 * that breaks can be disabled with an UPDATE instead of a redeploy.
 *
 * Deploy:  npx supabase functions deploy news-refresh --no-verify-jwt
 *
 * Secrets (server only, never `EXPO_PUBLIC_*`):
 *   npx supabase secrets set NEWS_REFRESH_SECRET=<secreto>
 *   and the same value in Vault as `news_secret` for the pg_cron job.
 *
 * Callers:
 *   * the app sends the project's public key on `apikey` (supabase-js adds it,
 *     even when the user is signed in);
 *   * pg_cron sends `x-news-secret: <NEWS_REFRESH_SECRET>` (see the cron
 *     migration). The shared secret is checked inside the function because the
 *     gateway no longer verifies a JWT for this function.
 *
 * Manual run (same as the cron):
 *   curl -X POST https://<project-ref>.supabase.co/functions/v1/news-refresh \
 *     -H "x-news-secret: $NEWS_REFRESH_SECRET" -H "Content-Type: application/json" -d '{}'
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

import { authorizeNewsRefresh } from '../_shared/news-auth.ts';
import {
  dedupeAcrossSources,
  normalizeFeed,
  type ContentKind,
  type NormalizedItem,
} from '../_shared/normalize.ts';

/** Publishers are not our CDN: never refetch a feed more than once per window. */
const THROTTLE_MS = 10 * 60_000;
const RETENTION_DAYS = 14;
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT = 'AFFutbol/1.0 (RSS reader; +https://alejandrofdez11.github.io/AffNoticiasFutbol)';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-news-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SourceRow = {
  id: string;
  label: string;
  feed_url: string;
  kind: ContentKind;
  topic: string;
  path_filter: string | null;
  max_items: number;
  last_fetched_at: string | null;
};

type SourceOutcome = {
  id: string;
  ok: boolean;
  items: number;
  skipped?: boolean;
  error?: string;
};

type FetchedSource = {
  source: SourceRow;
  items: NormalizedItem[];
  skipped: boolean;
  error?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

/** Supabase injects legacy anon keys and/or the named publishable keys. */
function projectPublicKeys(): string[] {
  const keys = new Set<string>();

  for (const name of ['SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY'] as const) {
    const value = Deno.env.get(name)?.trim();
    if (value) {
      keys.add(value);
    }
  }

  const named = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');

  if (named) {
    try {
      const parsed: unknown = JSON.parse(named);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const value of Object.values(parsed)) {
          if (typeof value === 'string' && value.trim()) {
            keys.add(value.trim());
          }
        }
      }
    } catch {
      console.warn('[news-refresh] SUPABASE_PUBLISHABLE_KEYS is not valid JSON');
    }
  }

  return [...keys];
}

async function fetchSource(source: SourceRow, now: number, force: boolean): Promise<FetchedSource> {
  const lastFetchedAt = source.last_fetched_at ? Date.parse(source.last_fetched_at) : 0;

  if (!force && now - lastFetchedAt < THROTTLE_MS) {
    return { source, items: [], skipped: true };
  }

  try {
    const response = await fetch(source.feed_url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = normalizeFeed(
      xml,
      {
        id: source.id,
        label: source.label,
        url: source.feed_url,
        kind: source.kind,
        topic: source.topic,
        maxItems: source.max_items,
        pathFilter: source.path_filter,
      },
      now
    );

    return { source, items, skipped: false };
  } catch (caught) {
    return {
      source,
      items: [],
      skipped: false,
      error: caught instanceof Error ? caught.message : String(caught),
    };
  }
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
  const newsSecret = Deno.env.get('NEWS_REFRESH_SECRET');

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  if (!newsSecret) {
    return json({ error: 'Missing NEWS_REFRESH_SECRET' }, 500);
  }

  const auth = authorizeNewsRefresh({
    newsSecret,
    cronHeader: request.headers.get('x-news-secret'),
    apiKeyHeader: request.headers.get('apikey'),
    authorizationHeader: request.headers.get('authorization'),
    publicKeys: projectPublicKeys(),
    serviceRoleKey,
  });

  if (!auth.authorized) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Only the service role bypasses the publisher throttle; app and cron obey it.
  const force = auth.caller === 'service';

  const { data: sources, error: sourcesError } = await supabase
    .from('news_sources')
    .select('id, label, feed_url, kind, topic, path_filter, max_items, last_fetched_at')
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (sourcesError) {
    return json({ error: sourcesError.message }, 500);
  }

  const now = Date.now();
  const fetched = await Promise.all(
    ((sources ?? []) as SourceRow[]).map((source) => fetchSource(source, now, force))
  );

  // Several outlets report the same story: dedupe across sources, keeping the
  // highest-priority one (they arrive sorted from the database).
  const items = dedupeAcrossSources(fetched.flatMap((result) => result.items));

  let upsertError: string | null = null;

  if (items.length > 0) {
    const { error } = await supabase.from('news_items').upsert(items, { onConflict: 'id' });
    upsertError = error?.message ?? null;
  }

  const succeeded = fetched.filter((result) => !result.error && !result.skipped);

  if (succeeded.length > 0) {
    await supabase
      .from('news_sources')
      .update({ last_fetched_at: new Date(now).toISOString() })
      .in(
        'id',
        succeeded.map((result) => result.source.id)
      );
  }

  const cutoff = new Date(now - RETENTION_DAYS * 24 * 60 * 60_000).toISOString();
  await supabase.from('news_items').delete().lt('published_at', cutoff);

  const outcomes: SourceOutcome[] = fetched.map((result) => ({
    id: result.source.id,
    ok: !result.error && !upsertError,
    items: result.items.length,
    ...(result.skipped ? { skipped: true } : {}),
    ...(result.error ?? upsertError ? { error: result.error ?? upsertError ?? undefined } : {}),
  }));

  return json({
    refreshedAt: new Date(now).toISOString(),
    stored: upsertError ? 0 : items.length,
    sources: outcomes,
  });
});
