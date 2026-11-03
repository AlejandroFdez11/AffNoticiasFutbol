import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STATS = [
  { key: 'points', label: 'Puntos', value: '0' },
  { key: 'predictions', label: 'Predicciones', value: '0' },
  { key: 'rank', label: 'Ranking', value: '—' },
] as const;

export function PointsSummary() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.stats}>
        {STATS.map((stat) => (
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
        Tus puntos y tu posición se activarán con el sistema de predicciones de la Fase 4.
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
