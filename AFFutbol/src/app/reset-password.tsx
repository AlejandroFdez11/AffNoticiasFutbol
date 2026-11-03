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

import { describeAuthError, useAuth } from '@/features/auth/auth-context';
import {
  hasFormErrors,
  validatePassword,
  type AuthFormErrors,
} from '@/features/auth/validation';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  const handleSubmit = async () => {
    const nextErrors: AuthFormErrors = {
      password: validatePassword(password),
    };

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Repite la contraseña.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);

    if (hasFormErrors(nextErrors)) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await updatePassword(password);
      router.replace('/profile');
    } catch (submitError) {
      setError(describeAuthError(submitError));
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
        title="Nueva contraseña"
        subtitle="Elige una contraseña segura para volver a entrar en AFFutbol."
      />

      {status === 'authenticated' ? (
        <View style={styles.form}>
          <TextField
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            password
            error={errors.password}
            hint="Mínimo 8 caracteres."
            returnKeyType="next"
          />
          <TextField
            label="Repite la contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Vuelve a escribirla"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            password
            error={errors.confirmPassword}
            returnKeyType="done"
            onSubmitEditing={() => void handleSubmit()}
          />

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" style={{ color: theme.live }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <Button
            label="Guardar contraseña"
            loading={busy}
            onPress={() => void handleSubmit()}
          />
        </View>
      ) : status === 'loading' ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            Comprobando el enlace…
          </ThemedText>
        </View>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">El enlace ha caducado</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Solicita un nuevo correo de recuperación desde la pantalla de inicio de sesión.
          </ThemedText>
          <Button label="Solicitar otro enlace" onPress={() => router.replace('/auth')} />
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
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Radii.medium,
  },
});
