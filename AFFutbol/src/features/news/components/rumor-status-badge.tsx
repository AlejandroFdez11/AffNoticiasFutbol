import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { RUMOR_STATUS_META } from '../constants';
import type { RumorStatus } from '../types';

export function RumorStatusBadge({ status }: { status: RumorStatus }) {
  const theme = useTheme();
  const meta = RUMOR_STATUS_META[status];

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.dot, { backgroundColor: theme[meta.color] }]} />
      <ThemedText type="small" style={{ color: theme[meta.color] }}>
        {meta.label}
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
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radii.pill,
  },
});
