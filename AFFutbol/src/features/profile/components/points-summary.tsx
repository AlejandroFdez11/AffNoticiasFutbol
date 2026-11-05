import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PredictionSummary } from '@/features/predictions/scoring';

type PointsSummaryProps = {
  summary: PredictionSummary;
  rank?: number | null;
  loading?: boolean;
};

export function PointsSummary({ summary, rank = null, loading = false }: PointsSummaryProps) {
  const theme = useTheme();
  const placeholder = loading ? '·' : null;

  const stats = [
    { key: 'points', label: 'Puntos', value: placeholder ?? String(summary.totalPoints) },
    { key: 'predictions', label: 'Pronósticos', value: placeholder ?? String(summary.predictions) },
    { key: 'rank', label: 'Ranking', value: placeholder ?? (rank === null ? '—' : `#${rank}`) },
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
        {rank === null
          ? 'Haz tu primer pronóstico para entrar en el ranking mundial.'
          : 'Tu posición en el ranking mundial. Los puntos se actualizan al terminar cada partido.'}
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
