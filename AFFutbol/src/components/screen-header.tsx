import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ eyebrow, title, subtitle, right }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        {eyebrow ? (
          <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.brand }]}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="subtitle">{title}</ThemedText>
        {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  eyebrow: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
