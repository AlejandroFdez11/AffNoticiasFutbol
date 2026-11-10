/**
 * Pure helpers for the `api-football` Edge Function.
 *
 * The function is a narrow proxy: the app can only reach the endpoints and
 * parameters listed here, so a leaked anon key cannot be turned into a generic
 * relay for the API-Football quota. No Deno globals or network here, so Jest can
 * cover the validation exactly like `_shared/settle.ts`.
 */

/** Query values API-Football accepts; booleans are not used by the app. */
export type ProxyQueryValue = string | number;

export type ProxyRequest = {
  path: string;
  params: Record<string, ProxyQueryValue>;
};

export type ProxyRequestResult =
  | { ok: true; request: ProxyRequest }
  | { ok: false; code: 'bad-path' | 'bad-params'; message: string };

/**
 * Endpoints the app may use, with the only parameters each one accepts. Keep it
 * in sync with `src/services/api-football/fixtures.ts`.
 */
export const ALLOWED_ENDPOINTS: Readonly<Record<string, readonly string[]>> = {
  '/fixtures': ['date', 'id', 'timezone'],
  '/fixtures/events': ['fixture'],
  '/fixtures/lineups': ['fixture'],
  '/fixtures/statistics': ['fixture'],
};

/** At least one of these must be present, or the request has no target. */
const TARGET_PARAMS: Readonly<Record<string, readonly string[]>> = {
  '/fixtures': ['date', 'id'],
  '/fixtures/events': ['fixture'],
  '/fixtures/lineups': ['fixture'],
  '/fixtures/statistics': ['fixture'],
};

const MAX_VALUE_LENGTH = 64;

function normalizePath(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readValue(value: unknown): ProxyQueryValue | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MAX_VALUE_LENGTH) return null;
    return trimmed;
  }

  return null;
}

/**
 * Validates a `{ path, params }` body. `params` is optional for the endpoints
 * that carry their target in the path, but the app always sends one.
 */
export function parseProxyRequest(body: unknown): ProxyRequestResult {
  if (!isPlainObject(body)) {
    return { ok: false, code: 'bad-params', message: 'El cuerpo debe ser un objeto JSON.' };
  }

  const rawPath = body.path;
  if (typeof rawPath !== 'string') {
    return { ok: false, code: 'bad-path', message: 'Falta `path`.' };
  }

  const path = normalizePath(rawPath);
  const allowedParams = ALLOWED_ENDPOINTS[path];

  if (!allowedParams) {
    return { ok: false, code: 'bad-path', message: `Endpoint no permitido: ${rawPath}.` };
  }

  const rawParams = body.params ?? {};
  if (!isPlainObject(rawParams)) {
    return { ok: false, code: 'bad-params', message: '`params` debe ser un objeto.' };
  }

  const params: Record<string, ProxyQueryValue> = {};

  for (const [key, value] of Object.entries(rawParams)) {
    if (!allowedParams.includes(key)) {
      return {
        ok: false,
        code: 'bad-params',
        message: `Parámetro no permitido en ${path}: ${key}.`,
      };
    }

    const parsed = readValue(value);
    if (parsed === null) {
      return {
        ok: false,
        code: 'bad-params',
        message: `Valor no válido para ${key}.`,
      };
    }

    params[key] = parsed;
  }

  const target = TARGET_PARAMS[path] ?? [];
  if (target.length > 0 && !target.some((key) => key in params)) {
    return {
      ok: false,
      code: 'bad-params',
      message: `${path} necesita uno de estos parámetros: ${target.join(', ')}.`,
    };
  }

  return { ok: true, request: { path, params } };
}

/** Builds the upstream URL; the key travels in a header, never in the URL. */
export function buildUpstreamUrl(
  baseUrl: string,
  path: string,
  params: Record<string, ProxyQueryValue>
) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  const base = baseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;

  return query ? `${base}${suffix}?${query}` : `${base}${suffix}`;
}
