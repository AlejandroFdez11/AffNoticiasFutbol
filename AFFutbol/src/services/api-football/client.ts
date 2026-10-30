/**
 * Minimal HTTP client for API-Football (v3).
 *
 * - Reads the key from the public Expo environment (see `src/lib/env.ts`).
 * - Converts API error payloads into a typed `ApiFootballError` so screens can
 *   show actionable Spanish messages (free plan, daily quota, bad key...).
 * - Never logs the API key.
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

function buildUrl(baseUrl: string, path: string, params: ApiFootballQuery) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
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

/**
 * Performs a GET request against API-Football and returns the `response` payload.
 */
export async function apiFootballRequest<T>(
  path: string,
  params: ApiFootballQuery = {}
): Promise<T> {
  const key = env.apiFootballKey;

  if (!key) {
    throw new ApiFootballError('missing-key');
  }

  const url = buildUrl(env.apiFootballBaseUrl, path, params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_FOOTBALL_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-apisports-key': key,
      },
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = controller.signal.aborted;
    throw new ApiFootballError(aborted ? 'timeout' : 'network', { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiFootballError('http', { status: response.status });
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
