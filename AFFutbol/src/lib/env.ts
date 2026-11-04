/**
 * Environment configuration.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables only when they are referenced with
 * static dot notation, so keep these reads exactly as they are.
 */

const apiFootballKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY?.trim();
const apiFootballBaseUrl = process.env.EXPO_PUBLIC_API_FOOTBALL_BASE_URL?.trim();
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS?.trim().toLowerCase();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();

export const env = {
  apiFootballKey,
  apiFootballBaseUrl: apiFootballBaseUrl || 'https://v3.football.api-sports.io',
  /** Falls back to mock data when no API key is configured. */
  useMocks: useMocks === 'true' || (!apiFootballKey && useMocks !== 'false'),
  supabaseUrl: supabaseUrl || undefined,
  supabaseAnonKey: supabaseAnonKey || undefined,
  /** Authentication needs a Supabase URL and a publishable/anon key. */
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
} as const;

export const hasFootballApiKey = Boolean(env.apiFootballKey);
