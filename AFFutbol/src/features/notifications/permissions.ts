/**
 * Thin wrapper around `expo-notifications`.
 *
 * Everything here no-ops on web: Expo push only exists on iOS and Android, and
 * the rest of the app must keep working when it is unavailable.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { env } from '@/lib/env';

import { NOTIFICATION_CHANNEL_ID, NOTIFICATION_CHANNEL_NAME } from './constants';
import type { PushPermissionState } from './types';

export function isPushSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * `getExpoPushTokenAsync` needs the EAS project id. `eas init` writes it into
 * `app.json`; `EXPO_PUBLIC_EAS_PROJECT_ID` covers builds made without it.
 */
export function getExpoProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;

  return (
    extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? env.easProjectId ?? null
  );
}

/** Android needs the channel to exist before the first notification arrives. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: NOTIFICATION_CHANNEL_NAME,
    description: 'Recordatorios de partidos, resultados y cambios de ranking.',
    importance: AndroidImportance.DEFAULT,
    lightColor: '#0B7A4B',
  });
}

function toPermissionState(
  settings: Notifications.NotificationPermissionsStatus
): PushPermissionState {
  if (
    settings.granted ||
    settings.ios?.status === IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }

  // `canAskAgain` is false once the user rejected the prompt (or a restriction
  // is active): from then on only the system settings app can change it.
  return settings.canAskAgain === false ? 'denied' : 'undetermined';
}

export async function readPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) {
    return 'unavailable';
  }

  try {
    return toPermissionState(await Notifications.getPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) {
    return 'unavailable';
  }

  try {
    const settings = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });

    return toPermissionState(settings);
  } catch {
    return 'denied';
  }
}

/**
 * Registers the device with Expo and returns the push token, or null when the
 * platform, the permission or the project id are missing.
 */
export async function readExpoPushToken(): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  const projectId = getExpoProjectId();

  if (!projectId) {
    return null;
  }

  await ensureNotificationChannel();

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export function getDeviceName(): string | null {
  const name = Device.deviceName ?? Device.modelName;
  return name && name.trim().length > 0 ? name.trim() : null;
}
