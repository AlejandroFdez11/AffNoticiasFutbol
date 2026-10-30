import { Pressable, StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type SegmentedControlProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      {options.map((option) => {
        const selected = option.key === value;

        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.item,
              selected && { backgroundColor: theme.brandMuted },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type={selected ? 'smallBold' : 'small'}
              style={{ color: selected ? theme.brand : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.half,
    padding: Spacing.half,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
