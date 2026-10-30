/**
 * Environment configuration.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables only when they are referenced with
 * static dot notation, so keep these reads exactly as they are.
 */

const apiFootballKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY?.trim();
const apiFootballBaseUrl = process.env.EXPO_PUBLIC_API_FOOTBALL_BASE_URL?.trim();
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS?.trim().toLowerCase();

export const env = {
  apiFootballKey,
  apiFootballBaseUrl: apiFootballBaseUrl || 'https://v3.football.api-sports.io',
  /** Falls back to mock data when no API key is configured. */
  useMocks: useMocks === 'true' || (!apiFootballKey && useMocks !== 'false'),
} as const;

export const hasFootballApiKey = Boolean(env.apiFootballKey);
