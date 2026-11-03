import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { env } from '@/lib/env';

import { authStorage } from './storage';

/**
 * The app can boot without Supabase credentials (for example while only the
 * football screens are being developed). Auth features then render a setup
 * card instead of crashing.
 */
export const isSupabaseConfigured = env.isSupabaseConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        // The callback route exchanges the code explicitly on every platform.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

/** Deep link that Supabase redirects to after OAuth, email confirmation or recovery. */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth-callback');
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Añade EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return supabase;
}
