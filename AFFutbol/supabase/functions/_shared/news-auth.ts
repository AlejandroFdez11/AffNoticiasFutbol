/**
 * Pure authorization rules for `news-refresh`.
 *
 * The gateway accepts two very different callers once `verify_jwt = false`:
 * the app (with the project's public key) and pg_cron (with a dedicated shared
 * secret). Keeping the decision here makes it testable without Deno globals.
 */

export type NewsAuthCaller = 'cron' | 'app' | 'service';

export type NewsAuthInput = {
  /** Value of NEWS_REFRESH_SECRET; the caller must never provide it directly. */
  newsSecret: string | null;
  /** `x-news-secret` header, used only by the cron job. */
  cronHeader?: string | null;
  /** `apikey` header sent by supabase-js on every app request. */
  apiKeyHeader?: string | null;
  /** Full `authorization` header, e.g. `Bearer <token>`. */
  authorizationHeader?: string | null;
  /** Public keys provisioned by Supabase (legacy anon and/or publishable). */
  publicKeys?: readonly string[];
  /** Runtime service-role key; only a manual maintenance call uses it. */
  serviceRoleKey?: string | null;
};

export type NewsAuthResult =
  | { authorized: true; caller: NewsAuthCaller; force: boolean }
  | { authorized: false };

function bearerToken(authorization: string | null | undefined): string | null {
  const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 ? token : null;
}

export function authorizeNewsRefresh(input: NewsAuthInput): NewsAuthResult {
  const {
    newsSecret,
    cronHeader,
    apiKeyHeader,
    authorizationHeader,
    publicKeys = [],
    serviceRoleKey,
  } = input;

  if (!newsSecret) {
    return { authorized: false };
  }

  if (cronHeader && cronHeader === newsSecret) {
    // The cron runs more often than the publisher throttle, so it obeys it.
    return { authorized: true, caller: 'cron', force: false };
  }

  if (serviceRoleKey && authorizationHeader === `Bearer ${serviceRoleKey}`) {
    // Maintenance escape hatch: the service role may bypass the throttle.
    return { authorized: true, caller: 'service', force: true };
  }

  const presented = [apiKeyHeader, bearerToken(authorizationHeader)].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );

  if (publicKeys.some((key) => key.length > 0 && presented.includes(key))) {
    return { authorized: true, caller: 'app', force: false };
  }

  return { authorized: false };
}
