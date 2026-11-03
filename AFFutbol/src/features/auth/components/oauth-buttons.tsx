import * as AppleAuthentication from 'expo-apple-authentication';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OAuthButtonsProps = {
  mode: 'signIn' | 'signUp';
  busy: 'google' | 'apple' | null;
  onGoogle: () => void;
  onApple: () => void;
};

export function OAuthButtons({ mode, busy, onGoogle, onApple }: OAuthButtonsProps) {
  const theme = useTheme();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    let active = true;

    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (active) {
          setAppleAvailable(available);
        }
      })
      .catch(() => {
        if (active) {
          setAppleAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Button
        label={mode === 'signUp' ? 'Registrarme con Google' : 'Continuar con Google'}
        variant="secondary"
        loading={busy === 'google'}
        disabled={busy !== null && busy !== 'google'}
        onPress={onGoogle}
        icon={
          <View style={[styles.googleIcon, { borderColor: theme.border }]}>
            <Text style={styles.googleLetter}>G</Text>
          </View>
        }
      />

      {Platform.OS === 'ios' && appleAvailable ? (
        <View
          pointerEvents={busy ? 'none' : 'auto'}
          style={[styles.appleButton, busy === 'apple' && styles.disabled]}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              mode === 'signUp'
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={Radii.medium}
            style={styles.appleNative}
            onPress={onApple}
          />
        </View>
      ) : (
        <Button
          label={mode === 'signUp' ? 'Registrarme con Apple' : 'Continuar con Apple'}
          variant="secondary"
          loading={busy === 'apple'}
          disabled={busy !== null && busy !== 'apple'}
          onPress={onApple}
          icon={
            <SymbolView
              name={{ ios: 'apple.logo', android: 'phone_iphone', web: 'phone_iphone' }}
              size={20}
              tintColor={theme.text}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleLetter: {
    color: '#4285F4',
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 18,
  },
  appleButton: {
    minHeight: 48,
  },
  appleNative: {
    width: '100%',
    height: 48,
  },
  disabled: {
    opacity: 0.5,
  },
});
