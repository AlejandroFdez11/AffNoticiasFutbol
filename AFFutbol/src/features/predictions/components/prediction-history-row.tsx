import { parseISO } from 'date-fns';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMatchTime, formatShortDate } from '@/lib/format';

import { getOutcomeLabel, getPredictionOutcome } from '../scoring';
import type { Prediction, PredictionOutcome } from '../types';

type PredictionHistoryRowProps = {
  prediction: Prediction;
};

function badgeColor(outcome: PredictionOutcome): 'success' | 'accent' | 'textSecondary' {
  switch (outcome) {
    case 'exact':
      return 'success';
    case 'partial':
      return 'accent';
    default:
      return 'textSecondary';
  }
}

function pointsLabel(prediction: Prediction, outcome: PredictionOutcome): string {
  if (outcome === 'void') {
    return 'Anulado';
  }

  if (outcome === 'pending') {
    return 'Pendiente';
  }

  return `+${prediction.points ?? 0} pts`;
}

export function PredictionHistoryRow({ prediction }: PredictionHistoryRowProps) {
  const theme = useTheme();
  const outcome = getPredictionOutcome(prediction);
  const kickoff = parseISO(prediction.kickoffAt);
  const hasFinalScore = prediction.finalHomeGoals !== null && prediction.finalAwayGoals !== null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatShortDate(kickoff)} · {formatMatchTime(prediction.kickoffAt)}
        </ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme[badgeColor(outcome)] }}>
            {pointsLabel(prediction, outcome)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <ThemedText type="small" numberOfLines={1} style={styles.team}>
          {prediction.homeTeamName}
        </ThemedText>
        <ThemedText type="smallBold">
          {prediction.homeGoals} - {prediction.awayGoals}
        </ThemedText>
        <ThemedText type="small" numberOfLines={1} style={[styles.team, styles.teamRight]}>
          {prediction.awayTeamName}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {getOutcomeLabel(outcome)}
        {hasFinalScore
          ? ` · Resultado final ${prediction.finalHomeGoals} - ${prediction.finalAwayGoals}`
          : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radii.pill,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  team: {
    flex: 1,
  },
  teamRight: {
    textAlign: 'right',
  },
});
