import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { SupabaseSetupCard } from '@/components/supabase-setup-card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { describeAuthError, isAuthCancelled, useAuth } from '@/features/auth/auth-context';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import {
  hasFormErrors,
  normalizeEmail,
  validateEmail,
  validateSignInForm,
  validateSignUpForm,
  type AuthFormErrors,
} from '@/features/auth/validation';

type Mode = 'signIn' | 'signUp';
type Busy = 'email' | 'google' | 'apple' | null;

const MODE_OPTIONS = [
  { key: 'signIn', label: 'Iniciar sesión' },
  { key: 'signUp', label: 'Crear cuenta' },
] as const;

export default function AuthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    status,
    isConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    requestPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<Mode>(params.mode === 'signUp' ? 'signUp' : 'signIn');
  const [forgot, setForgot] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  const afterAuth = () => {
    router.replace('/profile');
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setForgot(false);
    setErrors({});
    setError(null);
    setResetSent(false);
    setConfirmationEmail(null);
  };

  const handleSubmit = async () => {
    const nextErrors: AuthFormErrors = forgot
      ? { email: validateEmail(email) }
      : mode === 'signIn'
        ? validateSignInForm(email, password)
        : validateSignUpForm(email, password, confirmPassword, displayName);

    setErrors(nextErrors);

    if (hasFormErrors(nextErrors)) {
      return;
    }

    setBusy('email');
    setError(null);

    try {
      if (forgot) {
        await requestPasswordReset(email);
        setResetSent(true);
        return;
      }

      if (mode === 'signIn') {
        await signIn(email, password);
        afterAuth();
        return;
      }

      const result = await signUp({ email, password, displayName });

      if (result.needsEmailConfirmation) {
        setConfirmationEmail(normalizeEmail(email));
        return;
      }

      afterAuth();
    } catch (submitError) {
      setError(describeAuthError(submitError));
    } finally {
      setBusy(null);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setBusy(provider);
    setError(null);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }

      afterAuth();
    } catch (oauthError) {
      if (!isAuthCancelled(oauthError)) {
        setError(describeAuthError(oauthError));
      }
    } finally {
      setBusy(null);
    }
  };

  const title = forgot
    ? 'Recuperar acceso'
    : mode === 'signIn'
      ? 'Iniciar sesión'
      : 'Crear cuenta';

  const subtitle = forgot
    ? 'Te enviaremos un enlace para elegir una nueva contraseña.'
    : mode === 'signIn'
      ? 'Entra para guardar tus predicciones y competir con tus amigos.'
      : 'Crea tu cuenta y empieza a sumar puntos con cada acierto.';

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <BrandMark size={36} />
          <ThemedText type="smallBold">AFFutbol</ThemedText>
        </View>
        <IconButton
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          label="Cerrar"
          tone="textSecondary"
          onPress={close}
        />
      </View>

      <ScreenHeader eyebrow="Tu cuenta" title={title} subtitle={subtitle} />

      {!isConfigured ? <SupabaseSetupCard /> : null}

      {isConfigured && status === 'authenticated' ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Ya has iniciado sesión</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Puedes gestionar tu perfil, tu equipo favorito y tus puntos desde la pestaña Perfil.
          </ThemedText>
          <Button label="Ir a mi perfil" onPress={afterAuth} />
        </View>
      ) : null}

      {isConfigured && status !== 'authenticated' && confirmationEmail ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Revisa tu correo</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Hemos enviado un enlace de confirmación a {confirmationEmail}. Ábrelo en este dispositivo
            para activar tu cuenta.
          </ThemedText>
          <Button label="Ya lo he confirmado" variant="secondary" onPress={() => switchMode('signIn')} />
          <Button label="Volver al inicio" variant="ghost" onPress={close} />
        </View>
      ) : null}

      {isConfigured && status !== 'authenticated' && resetSent ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Enlace enviado</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Si existe una cuenta con {normalizeEmail(email)}, recibirás un correo para restablecer la
            contraseña. Revisa también la carpeta de spam.
          </ThemedText>
          <Button label="Volver a iniciar sesión" variant="secondary" onPress={() => setForgot(false)} />
        </View>
      ) : null}

      {isConfigured &&
      status !== 'authenticated' &&
      !confirmationEmail &&
      !resetSent ? (
        <View style={styles.form}>
          {!forgot ? (
            <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={switchMode} />
          ) : null}

          {mode === 'signUp' && !forgot ? (
            <TextField
              label="Nombre"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="¿Cómo quieres que te llamemos?"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={errors.displayName}
              maxLength={40}
            />
          ) : null}

          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
            returnKeyType="next"
          />

          {!forgot ? (
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              password
              error={errors.password}
              hint={mode === 'signUp' ? 'Mínimo 8 caracteres.' : undefined}
              returnKeyType={mode === 'signIn' ? 'done' : 'next'}
              onSubmitEditing={mode === 'signIn' ? () => void handleSubmit() : undefined}
            />
          ) : null}

          {mode === 'signUp' && !forgot ? (
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
          ) : null}

          {mode === 'signIn' && !forgot ? (
            <Button
              label="He olvidado mi contraseña"
              variant="ghost"
              onPress={() => {
                setForgot(true);
                setError(null);
                setErrors({});
              }}
              style={styles.forgotButton}
            />
          ) : null}

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" style={{ color: theme.live }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <Button
            label={
              forgot
                ? 'Enviar enlace'
                : mode === 'signIn'
                  ? 'Entrar'
                  : 'Crear mi cuenta'
            }
            loading={busy === 'email'}
            disabled={busy !== null && busy !== 'email'}
            onPress={() => void handleSubmit()}
          />

          {forgot ? (
            <Button
              label="Volver a iniciar sesión"
              variant="ghost"
              onPress={() => {
                setForgot(false);
                setResetSent(false);
                setError(null);
                setErrors({});
              }}
            />
          ) : (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  o continúa con
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <OAuthButtons
                mode={mode}
                busy={busy === 'google' || busy === 'apple' ? busy : null}
                onGoogle={() => void handleOAuth('google')}
                onApple={() => void handleOAuth('apple')}
              />
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
            Al continuar aceptas las condiciones de uso y la política de privacidad de AFFutbol.
          </ThemedText>
        </View>
      ) : null}
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  form: {
    gap: Spacing.three,
  },
  forgotButton: {
    alignSelf: 'flex-start',
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Radii.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  legal: {
    textAlign: 'center',
  },
});
