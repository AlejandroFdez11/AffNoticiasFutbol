import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Radii, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type IconButtonProps = {
  icon: SymbolName;
  /** Accessible label in Spanish. */
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: ThemeColor;
};

export function IconButton({
  icon,
  label,
  onPress,
  busy = false,
  disabled = false,
  tone = 'brand',
}: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={theme[tone]} />
      ) : (
        <SymbolView name={icon} size={18} tintColor={theme[tone]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
