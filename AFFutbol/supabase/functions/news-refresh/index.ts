/**
 * `news-refresh` — downloads the configured RSS feeds, normalises them and
 * upserts the result into `public.news_items`.
 *
 * The app never parses XML: it reads the table through PostgREST. This keeps
 * CORS, deduplication, stable ids and caching in one place, and means a feed
 * that breaks can be disabled with an UPDATE instead of a redeploy.
 *
 * Deploy:  npx supabase functions deploy news-refresh
 * Secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the
 *          runtime, so there is nothing to configure.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

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
const USER_AGENT = 'AFFutbol/1.0 (RSS reader; +https://affutbol.app)';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Only the service role may bypass the throttle; the app always goes through it.
  const authorization = request.headers.get('authorization') ?? '';
  const force = authorization === `Bearer ${serviceRoleKey}`;

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

  // Marca's front page and its LaLiga section repeat the same story: dedupe
  // across sources, keeping the highest-priority one (they arrive sorted).
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
