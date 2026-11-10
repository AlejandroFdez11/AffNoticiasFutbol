/**
 * Minimal HTTP client for API-Football (v3).
 *
 * Two transports:
 * - Proxy (production): POSTs `{ path, params }` to the `api-football` Supabase
 *   Edge Function, which holds the API key server-side. The key never reaches
 *   the phone, so it can be rotated or upgraded without shipping a new build.
 * - Direct (local development only): reads the key from the public Expo
 *   environment (see `src/lib/env.ts`).
 *
 * Both return the same API-Football envelope, so the error mapping below is
 * shared. Errors become a typed `ApiFootballError` with a Spanish message the
 * screens can render (free plan, daily quota, bad key...). The key is never
 * logged.
 */

import { env } from '@/lib/env';

import type { ApiFootballErrors, ApiFootballResponse } from './types';

export type ApiFootballErrorCode =
  | 'missing-key'
  | 'auth'
  | 'plan'
  | 'quota'
  | 'http'
  | 'network'
  | 'timeout'
  | 'api';

const ERROR_MESSAGES: Record<ApiFootballErrorCode, string> = {
  'missing-key': 'No hay una API key de API-Football configurada.',
  auth: 'La API key de API-Football no es válida.',
  plan: 'Tu plan de API-Football no da acceso a estos datos.',
  quota: 'Has agotado las peticiones diarias de API-Football. Vuelve mañana.',
  http: 'API-Football ha respondido con un error de servidor.',
  network: 'No se pudo conectar con API-Football. Revisa tu conexión.',
  timeout: 'API-Football tardó demasiado en responder. Inténtalo de nuevo.',
  api: 'API-Football devolvió un error inesperado.',
};

export const API_FOOTBALL_TIMEOUT_MS = 15_000;

type ApiFootballErrorOptions = {
  status?: number;
  details?: string;
  cause?: unknown;
};

export class ApiFootballError extends Error {
  readonly code: ApiFootballErrorCode;
  readonly status?: number;
  readonly details?: string;

  constructor(code: ApiFootballErrorCode, options: ApiFootballErrorOptions = {}) {
    super(buildMessage(code, options));
    this.name = 'ApiFootballError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
  }

  /** Short, user-facing description in Spanish. */
  get userMessage() {
    return ERROR_MESSAGES[this.code];
  }
}

function buildMessage(code: ApiFootballErrorCode, { status, details }: ApiFootballErrorOptions) {
  if (code === 'http' && status) {
    return `${ERROR_MESSAGES.http} (HTTP ${status})`;
  }
  return details ? `${ERROR_MESSAGES[code]} ${details}` : ERROR_MESSAGES[code];
}

export type ApiFootballQuery = Record<string, string | number | boolean | null | undefined>;

/** Drops the params API-Football should not receive. */
function compactParams(params: ApiFootballQuery) {
  return Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
}

function buildUrl(baseUrl: string, path: string, params: ApiFootballQuery) {
  const query = compactParams(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  const base = baseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;

  return query ? `${base}${suffix}?${query}` : `${base}${suffix}`;
}

function hasApiErrors(errors: ApiFootballErrors | undefined) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  return Object.keys(errors).length > 0;
}

function formatApiErrorDetails(errors: ApiFootballErrors) {
  if (Array.isArray(errors)) {
    return errors.map((error) => String(error)).join(' · ');
  }
  return Object.entries(errors)
    .map(([key, message]) => `${key}: ${message}`)
    .join(' · ');
}

function classifyApiError(errors: ApiFootballErrors): ApiFootballErrorCode {
  const keys = Array.isArray(errors)
    ? []
    : Object.keys(errors).map((key) => key.toLowerCase());

  if (keys.some((key) => key === 'token' || key === 'key' || key === 'apikey')) {
    return 'auth';
  }
  if (keys.some((key) => key === 'requests' || key === 'ratelimit' || key === 'rate')) {
    return 'quota';
  }
  if (keys.some((key) => key === 'plan' || key === 'season' || key === 'subscription')) {
    return 'plan';
  }
  return 'api';
}

/** HTTP statuses that mean something more specific than "server error". */
function classifyStatus(status: number): ApiFootballErrorCode {
  if (status === 429) return 'quota';
  if (status === 401 || status === 403) return 'auth';
  return 'http';
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_FOOTBALL_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const aborted = controller.signal.aborted;
    throw new ApiFootballError(aborted ? 'timeout' : 'network', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestUpstream(path: string, params: ApiFootballQuery) {
  const key = env.apiFootballKey;

  if (!key) {
    throw new ApiFootballError('missing-key');
  }

  return fetchWithTimeout(buildUrl(env.apiFootballBaseUrl, path, params), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-apisports-key': key,
    },
  });
}

async function requestThroughProxy(path: string, params: ApiFootballQuery) {
  const proxyUrl = env.apiFootballProxyUrl;
  const anonKey = env.supabaseAnonKey;

  if (!proxyUrl) {
    throw new ApiFootballError('missing-key');
  }

  if (!anonKey) {
    throw new ApiFootballError('missing-key', {
      details: 'Falta la anon key de Supabase para llamar al proxy.',
    });
  }

  const body: Record<string, string | number> = {};
  for (const [key, value] of compactParams(params)) {
    body[key] = String(value);
  }

  return fetchWithTimeout(proxyUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // The Edge Function verifies the JWT: the anon key is the only credential
      // the app needs, and it is public by design.
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ path, params: body }),
  });
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiFootballError(classifyStatus(response.status), { status: response.status });
  }

  let payload: ApiFootballResponse<T>;

  try {
    payload = (await response.json()) as ApiFootballResponse<T>;
  } catch (error) {
    throw new ApiFootballError('api', {
      status: response.status,
      cause: error,
      details: 'Respuesta no válida.',
    });
  }

  if (hasApiErrors(payload?.errors)) {
    throw new ApiFootballError(classifyApiError(payload.errors), {
      details: formatApiErrorDetails(payload.errors),
    });
  }

  return payload.response;
}

/**
 * Performs a request against API-Football and returns the `response` payload.
 * Uses the proxy when `EXPO_PUBLIC_API_FOOTBALL_PROXY_URL` is set.
 */
export async function apiFootballRequest<T>(
  path: string,
  params: ApiFootballQuery = {}
): Promise<T> {
  const response = env.apiFootballProxyUrl
    ? await requestThroughProxy(path, params)
    : await requestUpstream(path, params);

  return readResponse<T>(response);
}

/** Maps any thrown value to a message we can render in the UI. */
export function describeApiFootballError(error: unknown): string {
  if (error instanceof ApiFootballError) {
    return error.userMessage;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return ERROR_MESSAGES.api;
}
