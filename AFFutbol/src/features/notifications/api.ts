import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';
import { requireSupabase } from '@/features/auth/supabase';

import { DEVICE_STATE_STALE_TIME_MS, NOTIFICATION_PREFERENCES_STALE_TIME_MS } from './constants';
import {
  disablePushNotifications,
  enablePushNotifications,
  readDevicePushState,
} from './device';
import {
  mapNotificationPreferences,
  toNotificationPreferencesPatch,
  type DevicePushState,
  type NotificationPreferences,
  type NotificationPreferencesRow,
} from './types';

export const notificationKeys = {
  all: ['notifications'] as const,
  device: ['notifications', 'device'] as const,
  preferences: (userId: string) => ['notifications', 'preferences', userId] as const,
};

type ErrorWithCode = { code?: string; message?: string };

function readError(error: unknown): ErrorWithCode {
  if (typeof error === 'object' && error !== null) {
    const value = error as ErrorWithCode;
    return {
      code: typeof value.code === 'string' ? value.code : undefined,
      message: typeof value.message === 'string' ? value.message : undefined,
    };
  }

  return { message: typeof error === 'string' ? error : undefined };
}

/** Maps Postgres/PostgREST errors to copy the user can act on. */
export function describeNotificationError(error: unknown): string {
  const { code, message } = readError(error);
  const normalized = message?.toLowerCase() ?? '';

  switch (code) {
    case '42P01':
    case 'PGRST205':
      return 'Faltan las tablas de notificaciones. Ejecuta la migración de Supabase.';
    case 'PGRST202':
    case '42883':
      return 'Faltan las funciones de notificaciones. Ejecuta la migración de Supabase.';
    case '22023':
    case '42501':
    case 'P0002':
      // The database already returns Spanish, user-facing messages.
      return message ?? 'No se pudo completar la operación.';
    default:
      break;
  }

  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  return message || 'No se pudo completar la operación. Inténtalo de nuevo.';
}

async function fetchNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('notification_preferences')
    .select('user_id, match_reminders, match_results, ranking_changes')
    .eq('user_id', userId)
    .maybeSingle<NotificationPreferencesRow>();

  if (error) {
    throw error;
  }

  return mapNotificationPreferences(data);
}

async function saveNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('notification_preferences')
    .upsert(
      { user_id: userId, ...toNotificationPreferencesPatch(patch) },
      { onConflict: 'user_id' }
    )
    .select('user_id, match_reminders, match_results, ranking_changes')
    .single<NotificationPreferencesRow>();

  if (error) {
    throw error;
  }

  return mapNotificationPreferences(data);
}

export function useDevicePushState() {
  return useQuery({
    queryKey: notificationKeys.device,
    queryFn: readDevicePushState,
    staleTime: DEVICE_STATE_STALE_TIME_MS,
  });
}

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.preferences(user?.id ?? 'anonymous'),
    queryFn: () => fetchNotificationPreferences(user!.id),
    enabled: Boolean(user),
    staleTime: NOTIFICATION_PREFERENCES_STALE_TIME_MS,
  });
}

export function useUpdateNotificationPreferences() {
  const client = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => {
      if (!user) {
        throw new Error('Inicia sesión para cambiar tus notificaciones.');
      }

      return saveNotificationPreferences(user.id, patch);
    },
    onSuccess: (preferences) => {
      if (!user) {
        return;
      }

      client.setQueryData(notificationKeys.preferences(user.id), preferences);
    },
  });
}

/** Switching the master control on asks for permission and registers the device. */
export function useEnablePushNotifications() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: enablePushNotifications,
    onSuccess: (result) => {
      if (!result.ok) {
        return;
      }

      client.setQueryData<DevicePushState>(notificationKeys.device, {
        token: result.token,
        permission: 'granted',
      });
    },
  });
}

export function useDisablePushNotifications() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: disablePushNotifications,
    onSuccess: () => {
      client.setQueryData<DevicePushState>(notificationKeys.device, (previous) => ({
        token: null,
        permission: previous?.permission ?? 'undetermined',
      }));
    },
  });
}
