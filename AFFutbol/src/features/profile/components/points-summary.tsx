import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PredictionSummary } from '@/features/predictions/scoring';

type PointsSummaryProps = {
  summary: PredictionSummary;
  loading?: boolean;
};

export function PointsSummary({ summary, loading = false }: PointsSummaryProps) {
  const theme = useTheme();
  const placeholder = loading ? '·' : null;

  const stats = [
    { key: 'points', label: 'Puntos', value: placeholder ?? String(summary.totalPoints) },
    { key: 'predictions', label: 'Pronósticos', value: placeholder ?? String(summary.predictions) },
    { key: 'rank', label: 'Ranking', value: '—' },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.key} style={styles.stat}>
            <ThemedText type="subtitle" style={{ color: theme.brand }}>
              {stat.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {stat.label}
            </ThemedText>
          </View>
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        Tus puntos se actualizan al terminar cada partido. El ranking mundial llega en la Fase 5.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  note: {
    textAlign: 'center',
  },
});
