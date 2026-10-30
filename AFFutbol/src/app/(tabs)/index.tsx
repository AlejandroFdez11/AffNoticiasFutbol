import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLongDate } from '@/lib/format';

const HIGHLIGHTS = [
  'Calendario por fecha y competición',
  'Marcador en directo con minuto',
  'Detalle con eventos, alineaciones y estadísticas',
];

export default function MatchesScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader eyebrow="AFFutbol" title="Partidos" subtitle={formatLongDate(new Date())} />

      <View
        style={[
          styles.hero,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.brandMuted }]}>
          <SymbolView
            name={{ ios: 'sportscourt', android: 'sports_soccer', web: 'sports_soccer' }}
            size={48}
            tintColor={theme.brand}
          />
        </View>
        <ThemedText type="subtitle" style={styles.heroTitle}>
          Todo el fútbol del día
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.heroText}>
          Resultados en directo, alineaciones y estadísticas de tus competiciones favoritas.
        </ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>
            Fase 1 en camino
          </ThemedText>
        </View>
      </View>

      <View style={[styles.info, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">Qué encontrarás aquí</ThemedText>
        {HIGHLIGHTS.map((highlight) => (
          <View key={highlight} style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: theme.brand }]} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
              {highlight}
            </ThemedText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
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
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  heroText: {
    maxWidth: 420,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  info: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radii.pill,
  },
  infoText: {
    flex: 1,
  },
});
