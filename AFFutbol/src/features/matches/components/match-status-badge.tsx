import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Fixture } from '@/services/api-football/types';

import { getMatchPhase, getMatchStatusLabel } from '../mappers';

export function MatchStatusBadge({ fixture }: { fixture: Fixture }) {
  const theme = useTheme();
  const phase = getMatchPhase(fixture);
  const live = phase === 'live';
  const color = live ? theme.live : phase === 'scheduled' ? theme.brand : theme.textSecondary;

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: live ? theme.backgroundSelected : theme.background,
        },
      ]}>
      {live ? <View style={[styles.dot, { backgroundColor: theme.live }]} /> : null}
      <ThemedText type="smallBold" style={{ color }}>
        {getMatchStatusLabel(fixture)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radii.pill,
  },
});
