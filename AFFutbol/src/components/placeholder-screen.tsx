import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Screen } from './screen';
import { ScreenHeader } from './screen-header';
import { ThemedText } from './themed-text';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type PlaceholderScreenProps = {
  title: string;
  description: string;
  phase: string;
  icon: SymbolName;
};

export function PlaceholderScreen({ title, description, phase, icon }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader eyebrow="AFFutbol" title={title} />
      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.brandMuted }]}>
          <SymbolView name={icon} size={44} tintColor={theme.brand} />
        </View>
        <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>
            {phase}
          </ThemedText>
        </View>
        <ThemedText style={styles.description} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  description: {
    maxWidth: 360,
    textAlign: 'center',
  },
});
