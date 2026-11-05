/**
 * Device-level push registration.
 *
 * The Expo token of this device is kept in AsyncStorage so it can be released
 * on sign out: a second account on the same phone must not inherit the first
 * one's notifications. The server side is `register_push_token()` and
 * `unregister_push_token()` (see the Phase 6 migration), which never expose the
 * token to other users.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { requireSupabase } from '@/features/auth/supabase';

import { PUSH_TOKEN_STORAGE_KEY } from './constants';
import {
  getDeviceName,
  isPushSupported,
  readExpoPushToken,
  readPushPermission,
  requestPushPermission,
} from './permissions';
import { OFF_DEVICE_PUSH_STATE, type DevicePushState } from './types';

export type EnablePushResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: 'unsupported' | 'denied' | 'missing-project' | 'error';
      message: string;
    };

function platformName(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export async function readStoredPushToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    return token && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

async function storePushToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage is best effort: the server row is the source of truth.
  }
}

async function sendTokenToServer(token: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('register_push_token', {
    p_token: token,
    p_platform: platformName(),
    p_device_name: getDeviceName(),
    p_app_version: Constants.expoConfig?.version ?? null,
  });

  if (error) {
    throw error;
  }
}

async function removeTokenFromServer(token: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('unregister_push_token', { p_token: token });

  if (error) {
    throw error;
  }
}

/** Reads the permission and the stored token for the UI. */
export async function readDevicePushState(): Promise<DevicePushState> {
  if (!isPushSupported()) {
    return OFF_DEVICE_PUSH_STATE;
  }

  const [token, permission] = await Promise.all([
    readStoredPushToken(),
    readPushPermission(),
  ]);

  return { token, permission };
}

/**
 * Asks for the permission (if needed), obtains the Expo token and stores it on
 * the server. Called from the notifications card when the user flips the
 * switch on.
 */
export async function enablePushNotifications(): Promise<EnablePushResult> {
  if (!isPushSupported()) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'Las notificaciones push solo están disponibles en iOS y Android.',
    };
  }

  const current = await readPushPermission();
  const permission = current === 'granted' ? current : await requestPushPermission();

  if (permission !== 'granted') {
    return {
      ok: false,
      reason: 'denied',
      message: 'Has bloqueado las notificaciones de AFFutbol en este dispositivo.',
    };
  }

  const token = await readExpoPushToken();

  if (!token) {
    return {
      ok: false,
      reason: 'missing-project',
      message:
        'No se pudo obtener el token de push. Revisa el project id de EAS en app.json o en EXPO_PUBLIC_EAS_PROJECT_ID.',
    };
  }

  try {
    await sendTokenToServer(token);
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar el token.',
    };
  }

  await storePushToken(token);
  return { ok: true, token };
}

/** Removes this device from the server and forgets the token. */
export async function disablePushNotifications(): Promise<void> {
  const token = await readStoredPushToken();

  if (!token) {
    return;
  }

  try {
    await removeTokenFromServer(token);
  } finally {
    await storePushToken(null);
  }
}

/**
 * Refreshes `last_seen_at` (and reassigns the token after a login on a device
 * that was used by another account). Silent: a failure just retries next boot.
 */
export async function syncStoredPushToken(): Promise<void> {
  const token = await readStoredPushToken();

  if (!token || !isPushSupported()) {
    return;
  }

  const permission = await readPushPermission();

  if (permission !== 'granted') {
    return;
  }

  try {
    await sendTokenToServer(token);
  } catch {
    // Next launch.
  }
}

/**
 * Called right before signing out: the next account on this device must start
 * from scratch, otherwise it would receive the previous user's notifications.
 */
export async function releaseStoredPushToken(): Promise<void> {
  const token = await readStoredPushToken();

  if (!token) {
    return;
  }

  try {
    await removeTokenFromServer(token);
  } catch {
    // The session may already be gone; the local copy is still removed.
  }

  await storePushToken(null);
}
