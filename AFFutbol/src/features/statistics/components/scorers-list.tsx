import { StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ScorerRow } from '../types';
import { teamLabel } from '../logic';

export function ScorersList({ scorers }: { scorers: ScorerRow[] }) {
  const theme = useTheme();
  // Wikipedia only publishes goals, so the assists column is hidden instead of
  // rendering a blank one. Sample snapshots still carry assists.
  const showAssists = scorers.some((scorer) => typeof scorer.assists === 'number');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.titleRow}>
        <ThemedText type="smallBold">Goleadores</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {showAssists ? 'Goles · Asist.' : 'Goles'}
        </ThemedText>
      </View>

      {scorers.map((scorer, index) => (
        <View
          key={`${scorer.player}-${scorer.team.name}`}
          style={[styles.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.position}>
            {index + 1}
          </ThemedText>
          <TeamBadge name={teamLabel(scorer.team)} logo={scorer.team.logo} size={24} />
          <View style={styles.player}>
            <ThemedText type="small" numberOfLines={1}>
              {scorer.player}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {teamLabel(scorer.team)}
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.metric}>
            {scorer.goals}
          </ThemedText>
          {showAssists ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.metric}>
              {scorer.assists ?? '—'}
            </ThemedText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  position: {
    width: 20,
    textAlign: 'center',
  },
  player: {
    flex: 1,
    gap: 2,
  },
  metric: {
    width: 42,
    textAlign: 'right',
  },
});
