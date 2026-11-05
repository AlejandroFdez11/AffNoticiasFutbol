import { Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  describeNotificationError,
  useDevicePushState,
  useDisablePushNotifications,
  useEnablePushNotifications,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../api';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types';
import { SwitchRow } from './switch-row';

/**
 * Perfil → Notificaciones. The master switch registers this device with Expo;
 * the three switches below map to `public.notification_preferences`.
 */
export function NotificationsCard() {
  const theme = useTheme();
  const deviceQuery = useDevicePushState();
  const preferencesQuery = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const enablePush = useEnablePushNotifications();
  const disablePush = useDisablePushNotifications();

  const device = deviceQuery.data;
  const preferences = preferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const registered = Boolean(device?.token);
  const permission = device?.permission ?? 'undetermined';

  const toggleBusy = enablePush.isPending || disablePush.isPending;

  const error = (() => {
    if (enablePush.data && !enablePush.data.ok) {
      return enablePush.data.message;
    }

    if (enablePush.isError) {
      return describeNotificationError(enablePush.error);
    }

    if (disablePush.isError) {
      return describeNotificationError(disablePush.error);
    }

    if (updatePreferences.isError) {
      return describeNotificationError(updatePreferences.error);
    }

    if (deviceQuery.isError) {
      return describeNotificationError(deviceQuery.error);
    }

    return null;
  })();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Notificaciones</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Avisamos al móvil 1 hora antes de los partidos de tu equipo, cuando se cierran tus
          pronósticos y cuando cambia tu posición en el ranking.
        </ThemedText>
      </View>

      {permission === 'unavailable' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Las notificaciones push solo están disponibles en la app para iOS y Android.
        </ThemedText>
      ) : null}

      {permission === 'denied' ? (
        <View style={styles.group}>
          <ThemedText type="small" themeColor="textSecondary">
            Has bloqueado las notificaciones de AFFutbol. Actívalas en los ajustes del sistema
            para poder recibirlas.
          </ThemedText>
          <Button
            label="Abrir ajustes"
            variant="secondary"
            onPress={() => void Linking.openSettings()}
          />
        </View>
      ) : null}

      {permission === 'granted' || permission === 'undetermined' ? (
        <View style={styles.group}>
          <SwitchRow
            label="En este dispositivo"
            hint="Permite que AFFutbol envíe notificaciones a este móvil."
            value={registered}
            disabled={toggleBusy}
            onValueChange={(next) => {
              if (next) {
                enablePush.mutate();
              } else {
                disablePush.mutate();
              }
            }}
          />

          {registered ? (
            <View style={styles.preferences}>
              <SwitchRow
                label="Recordatorio antes del partido"
                hint="1 hora antes del inicio de los partidos de tu equipo favorito."
                value={preferences.matchReminders}
                disabled={updatePreferences.isPending}
                onValueChange={(value) =>
                  updatePreferences.mutate({ matchReminders: value })
                }
              />
              <SwitchRow
                label="Resultado de mis pronósticos"
                hint="Cuando termina el partido y se calculan tus puntos."
                value={preferences.matchResults}
                disabled={updatePreferences.isPending}
                onValueChange={(value) => updatePreferences.mutate({ matchResults: value })}
              />
              <SwitchRow
                label="Cambios de ranking"
                hint="Mundial y ligas privadas."
                value={preferences.rankingChanges}
                disabled={updatePreferences.isPending}
                onValueChange={(value) => updatePreferences.mutate({ rankingChanges: value })}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <ThemedText type="small" style={{ color: theme.live }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  header: {
    gap: Spacing.half,
    paddingBottom: Spacing.one,
  },
  group: {
    gap: Spacing.three,
  },
  preferences: {
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
});
