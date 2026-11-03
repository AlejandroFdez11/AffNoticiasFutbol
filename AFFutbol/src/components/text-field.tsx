import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  password?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  password = false,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.live : focused ? theme.brand : theme.border,
          },
        ]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={password && !visible}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setVisible((current) => !current)}
            style={styles.eye}>
            <SymbolView
              name={{
                ios: visible ? 'eye.slash' : 'eye',
                android: visible ? 'visibility_off' : 'visibility',
                web: visible ? 'visibility_off' : 'visibility',
              }}
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.live }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  eye: {
    paddingLeft: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
