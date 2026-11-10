/**
 * Environment configuration.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables only when they are referenced with
 * static dot notation, so keep these reads exactly as they are.
 */

const apiFootballKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY?.trim();
const apiFootballBaseUrl = process.env.EXPO_PUBLIC_API_FOOTBALL_BASE_URL?.trim();
const apiFootballProxyUrl = process.env.EXPO_PUBLIC_API_FOOTBALL_PROXY_URL?.trim();
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS?.trim().toLowerCase();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();

export const env = {
  /** Only used when the proxy is not configured (local development). */
  apiFootballKey,
  apiFootballBaseUrl: apiFootballBaseUrl || 'https://v3.football.api-sports.io',
  /**
   * Supabase Edge Function that proxies API-Football, e.g.
   * `https://<project-ref>.supabase.co/functions/v1/api-football`. When set, the
   * app sends no API key: the function holds it server-side.
   */
  apiFootballProxyUrl: apiFootballProxyUrl || undefined,
  /**
   * Falls back to mock data when neither the proxy nor an API key is configured.
   * A published build must configure the proxy; otherwise it shows mocks.
   */
  useMocks:
    useMocks === 'true' || (!apiFootballProxyUrl && !apiFootballKey && useMocks !== 'false'),
  supabaseUrl: supabaseUrl || undefined,
  supabaseAnonKey: supabaseAnonKey || undefined,
  /** Authentication needs a Supabase URL and a publishable/anon key. */
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  /** Expo push tokens need the EAS project id (`eas init` writes it to app.json). */
  easProjectId: easProjectId || undefined,
} as const;

export const hasFootballApiKey = Boolean(env.apiFootballKey);
export const hasFootballApiProxy = Boolean(env.apiFootballProxyUrl);
