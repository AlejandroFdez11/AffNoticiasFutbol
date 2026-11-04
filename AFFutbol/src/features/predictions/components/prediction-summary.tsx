import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PredictionSummary } from '../scoring';

type PredictionSummaryCardProps = {
  summary: PredictionSummary;
  loading?: boolean;
};

function describeSummary(summary: PredictionSummary, loading: boolean): string {
  if (loading) {
    return 'Cargando tus puntos…';
  }

  if (summary.settled === 0) {
    return 'Aún no hay pronósticos resueltos. Los puntos se suman cuando termina el partido.';
  }

  const settled = `${summary.settled} ${
    summary.settled === 1 ? 'pronóstico resuelto' : 'pronósticos resueltos'
  }`;

  if (summary.hitRate === null) {
    return settled;
  }

  return `${settled} · ${Math.round(summary.hitRate * 100)}% con acierto`;
}

export function PredictionSummaryCard({ summary, loading = false }: PredictionSummaryCardProps) {
  const theme = useTheme();
  const placeholder = loading ? '·' : null;

  const stats = [
    { key: 'points', label: 'Puntos', value: placeholder ?? String(summary.totalPoints) },
    { key: 'exact', label: 'Exactos', value: placeholder ?? String(summary.exact) },
    { key: 'pending', label: 'Pendientes', value: placeholder ?? String(summary.pending) },
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
        {describeSummary(summary, loading)}
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
