import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { describeAuthError, useAuth } from '@/features/auth/auth-context';
import { parseAuthRedirect } from '@/features/auth/parse-auth-redirect';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const linkingUrl = Linking.useURL();
  const { completeAuthFromUrl } = useAuth();
  const handled = useRef(false);
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (linkingUrl) {
      return linkingUrl;
    }

    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        query.set(key, value);
      }
    }

    return `affutbol://auth-callback?${query.toString()}`;
  }, [linkingUrl, params]);

  const parsed = useMemo(() => parseAuthRedirect(callbackUrl), [callbackUrl]);
  const invalidLinkError =
    parsed.error ??
    (!parsed.code && !(parsed.accessToken && parsed.refreshToken)
      ? 'El enlace de acceso no es válido o ha caducado.'
      : null);
  const error = asyncError ?? invalidLinkError;

  useEffect(() => {
    if (handled.current || invalidLinkError) {
      return;
    }

    handled.current = true;

    completeAuthFromUrl(callbackUrl)
      .then(() => {
        if (parsed.type === 'recovery') {
          router.replace('/reset-password');
          return;
        }

        router.replace('/profile');
      })
      .catch((authError: unknown) => {
        setAsyncError(describeAuthError(authError));
      });
  }, [callbackUrl, completeAuthFromUrl, invalidLinkError, parsed.type, router]);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Completando acceso"
        subtitle="Estamos validando tu enlace de acceso."
      />

      {error ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">No hemos podido completar el acceso</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Button label="Volver a iniciar sesión" onPress={() => router.replace('/auth')} />
        </View>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            Un momento…
          </ThemedText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.four,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
});
