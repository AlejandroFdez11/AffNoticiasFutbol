import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/features/auth/auth-context';
import {
  DELETE_ACCOUNT_CONFIRMATION,
  describeDeleteAccountError,
  isDeleteConfirmationValid,
} from '@/features/profile/delete-account';

/** Bullets for the warning card. Keep them in sync with the privacy policy. */
const DELETED_DATA = [
  'Tu cuenta y tu correo electrónico.',
  'Tu nombre, tu nombre de usuario y tu equipo favorito.',
  'Tus pronósticos, tus puntos y tu historial de resultados.',
  'Las ligas privadas que hayas creado (desaparecen también para sus miembros) y tu pertenencia a las demás.',
  'El token de notificaciones de este dispositivo y tus preferencias de aviso.',
];

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, user, deleteAccount } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmed = isDeleteConfirmationValid(confirmation);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  const handleDelete = async () => {
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await deleteAccount();
      // The session is gone: Perfil now renders the signed-out state.
      router.replace('/profile');
    } catch (deleteError) {
      setError(describeDeleteAccountError(deleteError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View />
        <IconButton
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          label="Cerrar"
          tone="textSecondary"
          onPress={close}
        />
      </View>

      <ScreenHeader
        eyebrow="Tu cuenta"
        title="Eliminar cuenta"
        subtitle="Borra tu cuenta y todo lo que has guardado. No se puede deshacer."
      />

      {status !== 'authenticated' || !user ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Inicia sesión para eliminar tu cuenta</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Solo puedes borrar la cuenta con la que has iniciado sesión.
          </ThemedText>
          <Button label="Iniciar sesión" onPress={() => router.replace('/auth')} />
        </View>
      ) : (
        <View style={styles.form}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="smallBold">Esto es permanente</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Al eliminar tu cuenta de AFFutbol ({user.email}) se borran en el momento:
            </ThemedText>
            <View style={styles.bullets}>
              {DELETED_DATA.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <ThemedText type="small" style={{ color: theme.live }}>
                    •
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
                    {item}
                  </ThemedText>
                </View>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Las copias de seguridad cifradas del proveedor se rotan como máximo en 7 días. Si
              vuelves a registrarte, empiezas de cero.
            </ThemedText>
          </View>

          <TextField
            label={`Escribe ${DELETE_ACCOUNT_CONFIRMATION} para confirmar`}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder={DELETE_ACCOUNT_CONFIRMATION}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={DELETE_ACCOUNT_CONFIRMATION.length}
          />

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" style={{ color: theme.live }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <Button
            label="Eliminar mi cuenta para siempre"
            variant="danger"
            loading={busy}
            disabled={!confirmed}
            onPress={() => void handleDelete()}
          />
          <Button label="Cancelar" variant="ghost" onPress={close} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  bullets: {
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bulletText: {
    flex: 1,
  },
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Radii.medium,
  },
});
