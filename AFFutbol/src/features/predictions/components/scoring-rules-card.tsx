import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { POINTS_EXACT_SCORE, POINTS_ONE_TEAM } from '../constants';

const RULES = [
  { key: 'exact', points: String(POINTS_EXACT_SCORE), label: 'Marcador exacto' },
  { key: 'partial', points: String(POINTS_ONE_TEAM), label: 'Goles de un solo equipo' },
  { key: 'miss', points: '0', label: 'Resto de casos' },
] as const;

export function ScoringRulesCard() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Cómo se puntúa</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pronostica el marcador antes del inicio del partido.
        </ThemedText>
      </View>

      {RULES.map((rule) => (
        <View key={rule.key} style={styles.rule}>
          <View style={[styles.points, { backgroundColor: theme.brandMuted }]}>
            <ThemedText type="smallBold" style={{ color: theme.brand }}>
              {rule.points}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {rule.label}
          </ThemedText>
        </View>
      ))}

      <ThemedText type="small" themeColor="textSecondary">
        El pronóstico se cierra al inicio del partido y ya no se puede editar.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  header: {
    gap: Spacing.half,
    paddingBottom: Spacing.one,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  points: {
    minWidth: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radii.small,
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
});
