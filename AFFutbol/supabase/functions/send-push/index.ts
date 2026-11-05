/**
 * `send-push` — the only writer of push notifications.
 *
 * Every run is triggered by pg_cron (see `20261109000100_push_cron.sql`) with a
 * shared secret, never by the app. Jobs:
 *
 *   reminders     fixtures of the user's favourite team kicking off in ~1 h
 *   results       predictions that `settle-predictions` just closed
 *   rankings      leaderboard position changed since the last run
 *   sync-fixtures caches today and tomorrow from API-Football (2 requests)
 *
 * The client can only register its Expo push token and its preferences; this
 * function reads them with the service role.
 *
 * Deploy:
 *   npx supabase functions deploy send-push --no-verify-jwt
 *
 * Secrets (server only, never `EXPO_PUBLIC_*`):
 *   npx supabase secrets set PUSH_NOTIFY_SECRET=... EXPO_ACCESS_TOKEN=...
 *   (API_FOOTBALL_KEY is already set for settle-predictions.)
 *
 * Call one job by hand:
 *   curl -X POST https://<project-ref>.supabase.co/functions/v1/send-push \
 *     -H "x-notify-secret: $PUSH_NOTIFY_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"job":"reminders","dryRun":true}'
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { normalizeFixtures, type CachedFixture } from '../_shared/fixture-cache.ts';
import {
  buildRankingCopy,
  buildReminderCopy,
  buildResultCopy,
  chunk,
  GLOBAL_SCOPE_KEY,
  isInReminderWindow,
  RANKING_THROTTLE_MINUTES,
  rankingDedupeKey,
  rankingDedupeScope,
  readDeliveredIndexes,
  readInvalidTokens,
  readLeagueId,
  reminderDedupeKey,
  REMINDER_LEAD_MINUTES,
  REMINDER_TOLERANCE_MINUTES,
  resultDedupeKey,
  type NotificationCopy,
  type PushKind,
} from '../_shared/notifications.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FIXTURES = 100;
const MAX_PREDICTIONS = 200;
const MAX_MESSAGES = 500;
const MAX_DEVICES = 5_000;
const RESULT_LOOKBACK_DAYS = 3;
const MAX_PREVIEW = 20;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type JobName = 'reminders' | 'results' | 'rankings' | 'sync-fixtures' | 'all';

const JOB_NAMES: readonly JobName[] = [
  'reminders',
  'results',
  'rankings',
  'sync-fixtures',
  'all',
];

type Device = { user_id: string; token: string };

type Preferences = {
  match_reminders: boolean;
  match_results: boolean;
  ranking_changes: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  match_reminders: true,
  match_results: true,
  ranking_changes: true,
};

type PendingPush = {
  userId: string;
  kind: PushKind;
  dedupeKey: string;
  token: string;
  copy: NotificationCopy;
};

type DispatchResult = {
  sent: number;
  failed: number;
  removedTokens: number;
};

type JobResult = {
  job: JobName;
  candidates: number;
  sent: number;
  failed: number;
  skipped: number;
  removedTokens: number;
  preview?: { title: string; body: string; url: string }[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function emptyResult(job: JobName): JobResult {
  return { job, candidates: 0, sent: 0, failed: 0, skipped: 0, removedTokens: 0 };
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Reads every device once and lets the caller look users up by id: an `.in()`
 * with thousands of uuids would blow up the PostgREST query string.
 */
async function loadDevices(supabase: SupabaseClient): Promise<Device[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .limit(MAX_DEVICES);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Device[];
}

function groupDevicesByUser(devices: readonly Device[]): Map<string, Device[]> {
  const grouped = new Map<string, Device[]>();

  for (const device of devices) {
    const list = grouped.get(device.user_id) ?? [];
    list.push(device);
    grouped.set(device.user_id, list);
  }

  return grouped;
}

/** Every stored preference row, keyed by user. Missing rows mean "all on". */
async function loadPreferences(
  supabase: SupabaseClient
): Promise<Map<string, Preferences>> {
  const map = new Map<string, Preferences>();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, match_reminders, match_results, ranking_changes');

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as (Preferences & { user_id: string })[]) {
    map.set(row.user_id, {
      match_reminders: row.match_reminders,
      match_results: row.match_results,
      ranking_changes: row.ranking_changes,
    });
  }

  return map;
}

/** `user_id|dedupe_key` pairs that were already sent for a kind. */
async function loadDeliveredPairs(
  supabase: SupabaseClient,
  kind: PushKind,
  dedupeKeys: readonly string[]
): Promise<Set<string>> {
  const delivered = new Set<string>();

  if (dedupeKeys.length === 0) {
    return delivered;
  }

  const { data, error } = await supabase
    .from('push_deliveries')
    .select('user_id, dedupe_key')
    .eq('kind', kind)
    .in('dedupe_key', dedupeKeys as string[]);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as { user_id: string; dedupe_key: string }[]) {
    delivered.add(`${row.user_id}|${row.dedupe_key}`);
  }

  return delivered;
}

/** `user_id|scope_key` pairs that received a ranking push recently. */
async function loadRankingThrottle(
  supabase: SupabaseClient,
  now: Date
): Promise<Set<string>> {
  const since = new Date(now.getTime() - RANKING_THROTTLE_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from('push_deliveries')
    .select('user_id, dedupe_key')
    .eq('kind', 'ranking')
    .gte('sent_at', since);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    ((data ?? []) as { user_id: string; dedupe_key: string }[]).map(
      (row) => `${row.user_id}|${rankingDedupeScope(row.dedupe_key)}`
    )
  );
}

async function dispatch(
  supabase: SupabaseClient,
  pushes: readonly PendingPush[],
  accessToken: string | undefined,
  dryRun: boolean
): Promise<DispatchResult & { preview: JobResult['preview'] }> {
  const candidates = pushes.slice(0, MAX_MESSAGES);

  if (dryRun || candidates.length === 0) {
    return {
      sent: 0,
      failed: 0,
      removedTokens: 0,
      preview: candidates.slice(0, MAX_PREVIEW).map((push) => ({
        title: push.copy.title,
        body: push.copy.body,
        url: push.copy.data.url,
      })),
    };
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  const invalidTokens = new Set<string>();
  const deliveredPushes: PendingPush[] = [];
  let failed = 0;

  for (const batch of chunk(candidates)) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(
          batch.map((push) => ({
            to: push.token,
            title: push.copy.title,
            body: push.copy.body,
            data: push.copy.data,
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          }))
        ),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        failed += batch.length;
        continue;
      }

      const payload = (await response.json()) as unknown;

      for (const token of readInvalidTokens(
        batch.map((push) => push.token),
        payload
      )) {
        invalidTokens.add(token);
      }

      for (const index of readDeliveredIndexes(payload)) {
        const push = batch[index];

        if (push) {
          deliveredPushes.push(push);
        }
      }
    } catch {
      failed += batch.length;
    }
  }

  if (invalidTokens.size > 0) {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .in('token', [...invalidTokens]);

    if (error) {
      console.error('Could not delete invalid tokens', error.message);
    }
  }

  if (deliveredPushes.length > 0) {
    const { error } = await supabase.from('push_deliveries').upsert(
      deliveredPushes.map((push) => ({
        user_id: push.userId,
        kind: push.kind,
        dedupe_key: push.dedupeKey,
      })),
      { onConflict: 'user_id,kind,dedupe_key', ignoreDuplicates: true }
    );

    if (error) {
      console.error('Could not record deliveries', error.message);
    }
  }

  return {
    sent: deliveredPushes.length,
    failed,
    removedTokens: invalidTokens.size,
    preview: undefined,
  };
}

// ---------------------------------------------------------------------------
// reminders
// ---------------------------------------------------------------------------

type CachedFixtureRow = Pick<
  CachedFixture,
  | 'fixture_id'
  | 'home_team_id'
  | 'home_team_name'
  | 'away_team_id'
  | 'away_team_name'
  | 'kickoff_at'
  | 'status_short'
>;

type PredictionRow = {
  user_id: string;
  fixture_id: number;
  home_goals: number;
  away_goals: number;
};

async function runReminders(
  supabase: SupabaseClient,
  now: Date,
  accessToken: string | undefined,
  dryRun: boolean
): Promise<JobResult> {
  const from = new Date(
    now.getTime() + (REMINDER_LEAD_MINUTES - REMINDER_TOLERANCE_MINUTES) * 60_000
  ).toISOString();
  const to = new Date(
    now.getTime() + (REMINDER_LEAD_MINUTES + REMINDER_TOLERANCE_MINUTES) * 60_000
  ).toISOString();

  const { data: fixtureData, error: fixtureError } = await supabase
    .from('fixtures')
    .select(
      'fixture_id, home_team_id, home_team_name, away_team_id, away_team_name, kickoff_at, status_short'
    )
    .gte('kickoff_at', from)
    .lte('kickoff_at', to)
    .eq('status_short', 'NS')
    .order('kickoff_at', { ascending: true })
    .limit(MAX_FIXTURES);

  if (fixtureError) {
    throw new Error(fixtureError.message);
  }

  const fixtures = (fixtureData ?? []) as CachedFixtureRow[];

  if (fixtures.length === 0) {
    return emptyResult('reminders');
  }

  const teamIds = unique(fixtures.flatMap((row) => [row.home_team_id, row.away_team_id]));

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, favorite_team_id')
    .in('favorite_team_id', teamIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileData ?? []) as { id: string; favorite_team_id: number }[];

  if (profiles.length === 0) {
    return emptyResult('reminders');
  }

  const fixtureIds = fixtures.map((row) => row.fixture_id);

  const { data: predictionData, error: predictionError } = await supabase
    .from('predictions')
    .select('user_id, fixture_id, home_goals, away_goals')
    .in('fixture_id', fixtureIds);

  if (predictionError) {
    throw new Error(predictionError.message);
  }

  const predictionByUserFixture = new Map(
    ((predictionData ?? []) as PredictionRow[]).map((row) => [
      `${row.user_id}:${row.fixture_id}`,
      row,
    ])
  );

  const devicesByUser = groupDevicesByUser(await loadDevices(supabase));
  const preferences = await loadPreferences(supabase);
  const delivered = await loadDeliveredPairs(
    supabase,
    'match_reminder',
    fixtures.map((row) => reminderDedupeKey(row.fixture_id))
  );

  const pushes: PendingPush[] = [];
  let skipped = 0;

  for (const fixture of fixtures) {
    const kickoffAt = new Date(fixture.kickoff_at);

    if (!isInReminderWindow(kickoffAt, now)) {
      continue;
    }

    const dedupeKey = reminderDedupeKey(fixture.fixture_id);

    for (const profile of profiles) {
      if (
        profile.favorite_team_id !== fixture.home_team_id &&
        profile.favorite_team_id !== fixture.away_team_id
      ) {
        continue;
      }

      const preference = preferences.get(profile.id) ?? DEFAULT_PREFERENCES;

      if (!preference.match_reminders || delivered.has(`${profile.id}|${dedupeKey}`)) {
        skipped += 1;
        continue;
      }

      const prediction = predictionByUserFixture.get(`${profile.id}:${fixture.fixture_id}`);

      const copy = buildReminderCopy({
        fixtureId: fixture.fixture_id,
        homeTeamName: fixture.home_team_name,
        awayTeamName: fixture.away_team_name,
        kickoffAt,
        now,
        prediction: prediction
          ? { homeGoals: prediction.home_goals, awayGoals: prediction.away_goals }
          : null,
      });

      for (const device of devicesByUser.get(profile.id) ?? []) {
        pushes.push({
          userId: profile.id,
          kind: 'match_reminder',
          dedupeKey,
          token: device.token,
          copy,
        });
      }
    }
  }

  const result = await dispatch(supabase, pushes, accessToken, dryRun);

  return {
    job: 'reminders',
    candidates: pushes.length,
    sent: result.sent,
    failed: result.failed,
    skipped,
    removedTokens: result.removedTokens,
    preview: result.preview,
  };
}

// ---------------------------------------------------------------------------
// results
// ---------------------------------------------------------------------------

type SettledPredictionRow = {
  id: string;
  user_id: string;
  status: 'settled' | 'void';
  points: number | null;
  home_goals: number;
  away_goals: number;
  final_home_goals: number | null;
  final_away_goals: number | null;
  home_team_name: string;
  away_team_name: string;
};

async function runResults(
  supabase: SupabaseClient,
  now: Date,
  accessToken: string | undefined,
  dryRun: boolean
): Promise<JobResult> {
  const since = new Date(now.getTime() - RESULT_LOOKBACK_DAYS * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from('predictions')
    .select(
      'id, user_id, status, points, home_goals, away_goals, final_home_goals, final_away_goals, home_team_name, away_team_name'
    )
    .in('status', ['settled', 'void'])
    .gte('settled_at', since)
    .order('settled_at', { ascending: true })
    .limit(MAX_PREDICTIONS);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SettledPredictionRow[];

  if (rows.length === 0) {
    return emptyResult('results');
  }

  const devicesByUser = groupDevicesByUser(await loadDevices(supabase));
  const preferences = await loadPreferences(supabase);
  const delivered = await loadDeliveredPairs(
    supabase,
    'result',
    rows.map((row) => resultDedupeKey(row.id))
  );

  const pushes: PendingPush[] = [];
  let skipped = 0;

  for (const row of rows) {
    const dedupeKey = resultDedupeKey(row.id);
    const preference = preferences.get(row.user_id) ?? DEFAULT_PREFERENCES;

    if (!preference.match_results || delivered.has(`${row.user_id}|${dedupeKey}`)) {
      skipped += 1;
      continue;
    }

    const copy = buildResultCopy({
      status: row.status,
      points: row.points,
      homeTeamName: row.home_team_name,
      awayTeamName: row.away_team_name,
      prediction: { homeGoals: row.home_goals, awayGoals: row.away_goals },
      finalScore:
        row.final_home_goals === null || row.final_away_goals === null
          ? null
          : { homeGoals: row.final_home_goals, awayGoals: row.final_away_goals },
    });

    for (const device of devicesByUser.get(row.user_id) ?? []) {
      pushes.push({
        userId: row.user_id,
        kind: 'result',
        dedupeKey,
        token: device.token,
        copy,
      });
    }
  }

  const result = await dispatch(supabase, pushes, accessToken, dryRun);

  return {
    job: 'results',
    candidates: pushes.length,
    sent: result.sent,
    failed: result.failed,
    skipped,
    removedTokens: result.removedTokens,
    preview: result.preview,
  };
}

// ---------------------------------------------------------------------------
// rankings
// ---------------------------------------------------------------------------

type PositionRow = { scope_key: string; user_id: string; position: number | string };

async function runRankings(
  supabase: SupabaseClient,
  now: Date,
  accessToken: string | undefined,
  dryRun: boolean
): Promise<JobResult> {
  const { data: positionData, error: positionError } = await supabase.rpc(
    'ranking_positions'
  );

  if (positionError) {
    throw new Error(positionError.message);
  }

  const positions = (positionData ?? []) as PositionRow[];

  if (positions.length === 0) {
    return emptyResult('rankings');
  }

  const { data: stateData, error: stateError } = await supabase
    .from('ranking_state')
    .select('user_id, scope_key, position');

  if (stateError) {
    throw new Error(stateError.message);
  }

  const previousByScope = new Map(
    ((stateData ?? []) as PositionRow[]).map((row) => [
      `${row.user_id}|${row.scope_key}`,
      Number(row.position),
    ])
  );

  const leagueIds = unique(
    positions
      .map((row) => readLeagueId(row.scope_key))
      .filter((id): id is string => Boolean(id) && id !== GLOBAL_SCOPE_KEY)
  );

  const leagueNames = new Map<string, string>();

  if (leagueIds.length > 0) {
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .in('id', leagueIds);

    if (leagueError) {
      throw new Error(leagueError.message);
    }

    for (const league of (leagueData ?? []) as { id: string; name: string }[]) {
      leagueNames.set(league.id, league.name);
    }
  }

  const devicesByUser = groupDevicesByUser(await loadDevices(supabase));
  const preferences = await loadPreferences(supabase);
  const throttled = dryRun ? new Set<string>() : await loadRankingThrottle(supabase, now);

  const pushes: PendingPush[] = [];
  const stateRows: {
    user_id: string;
    scope_key: string;
    position: number;
    updated_at: string;
  }[] = [];
  let skipped = 0;

  for (const row of positions) {
    const current = Number(row.position);
    stateRows.push({
      user_id: row.user_id,
      scope_key: row.scope_key,
      position: current,
      updated_at: now.toISOString(),
    });

    const previous = previousByScope.get(`${row.user_id}|${row.scope_key}`);

    if (previous === undefined || previous === current) {
      skipped += 1;
      continue;
    }

    const preference = preferences.get(row.user_id) ?? DEFAULT_PREFERENCES;

    if (!preference.ranking_changes || throttled.has(`${row.user_id}|${row.scope_key}`)) {
      skipped += 1;
      continue;
    }

    const leagueId = readLeagueId(row.scope_key);
    const copy = buildRankingCopy({
      scopeKey: row.scope_key,
      leagueName: leagueId ? leagueNames.get(leagueId) ?? null : null,
      previous,
      current,
    });
    const dedupeKey = rankingDedupeKey(row.scope_key, current, now);

    for (const device of devicesByUser.get(row.user_id) ?? []) {
      pushes.push({
        userId: row.user_id,
        kind: 'ranking',
        dedupeKey,
        token: device.token,
        copy,
      });
    }
  }

  const result = await dispatch(supabase, pushes, accessToken, dryRun);

  // A dry run never touches the snapshot: otherwise the change would be
  // consumed and the real run would find nothing to report.
  if (!dryRun) {
    const { error: upsertError } = await supabase
      .from('ranking_state')
      .upsert(stateRows, { onConflict: 'user_id,scope_key' });

    if (upsertError) {
      console.error('Could not refresh ranking_state', upsertError.message);
    }
  }

  return {
    job: 'rankings',
    candidates: pushes.length,
    sent: result.sent,
    failed: result.failed,
    skipped,
    removedTokens: result.removedTokens,
    preview: result.preview,
  };
}

// ---------------------------------------------------------------------------
// sync-fixtures
// ---------------------------------------------------------------------------

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function runSyncFixtures(
  supabase: SupabaseClient,
  now: Date,
  apiKey: string
): Promise<JobResult> {
  const dates = [isoDate(now), isoDate(new Date(now.getTime() + 86_400_000))];
  const fixtures: (CachedFixture & { updated_at: string })[] = [];
  let failed = 0;

  for (const date of dates) {
    try {
      const response = await fetch(`${API_FOOTBALL_BASE_URL}/fixtures?date=${date}`, {
        headers: { 'x-apisports-key': apiKey },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        failed += 1;
        continue;
      }

      const updatedAt = now.toISOString();

      fixtures.push(
        ...normalizeFixtures(await response.json()).map((fixture) => ({
          ...fixture,
          updated_at: updatedAt,
        }))
      );
    } catch {
      failed += 1;
    }
  }

  if (fixtures.length > 0) {
    const { error } = await supabase
      .from('fixtures')
      .upsert(fixtures, { onConflict: 'fixture_id' });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Yesterday's matches are no longer needed by the reminder.
  const { error: pruneError } = await supabase
    .from('fixtures')
    .delete()
    .lt('kickoff_at', new Date(now.getTime() - 86_400_000).toISOString());

  if (pruneError) {
    console.error('Could not prune fixtures', pruneError.message);
  }

  return {
    job: 'sync-fixtures',
    candidates: fixtures.length,
    sent: 0,
    failed,
    skipped: 0,
    removedTokens: 0,
  };
}

// ---------------------------------------------------------------------------
// handler
// ---------------------------------------------------------------------------

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('PUSH_NOTIFY_SECRET');

  if (!secret) {
    return json({ error: 'Missing PUSH_NOTIFY_SECRET' }, 500);
  }

  if (request.headers.get('x-notify-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN') ?? undefined;

  if (!url || !serviceRoleKey) {
    return json({ error: 'Missing Supabase runtime credentials' }, 500);
  }

  let job: JobName = 'all';
  let dryRun = false;

  try {
    const body = (await request.json()) as { job?: unknown; dryRun?: unknown } | null;

    if (typeof body?.job === 'string') {
      const requested = body.job.trim().toLowerCase();

      if (!(JOB_NAMES as readonly string[]).includes(requested)) {
        return json({ error: `Unknown job: ${body.job}` }, 400);
      }

      job = requested as JobName;
    }

    dryRun = body?.dryRun === true;
  } catch {
    // Empty body: run every notifier job.
  }

  if (job === 'sync-fixtures' && !apiKey) {
    return json({ error: 'Missing API_FOOTBALL_KEY secret' }, 500);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const jobs: JobResult[] = [];
  const errors: { job: string; error: string }[] = [];

  const runners: [JobName, () => Promise<JobResult>][] = [
    ['reminders', () => runReminders(supabase, now, accessToken, dryRun)],
    ['results', () => runResults(supabase, now, accessToken, dryRun)],
    ['rankings', () => runRankings(supabase, now, accessToken, dryRun)],
  ];

  if (job === 'sync-fixtures' && apiKey) {
    runners.push(['sync-fixtures', () => runSyncFixtures(supabase, now, apiKey)]);
  }

  for (const [name, run] of runners) {
    if (job !== 'all' && job !== name) {
      continue;
    }

    try {
      jobs.push(await run());
    } catch (caught) {
      errors.push({ job: name, error: messageOf(caught) });
    }
  }

  return json({ checkedAt: now.toISOString(), dryRun, jobs, errors });
});
