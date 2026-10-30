import { StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PositionedStanding } from '../types';
import { FormStrip } from './form-strip';

export function StandingsTable({ standings }: { standings: PositionedStanding[] }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.headerRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.position}>
          #
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.teamHeader}>
          Equipo
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.played}>
          PJ
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.difference}>
          DG
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.points}>
          PTS
        </ThemedText>
      </View>

      {standings.map((row, index) => {
        const leader = row.position === 1;

        return (
          <View
            key={row.team.name}
            accessibilityLabel={`${row.position}. ${row.team.name}, ${row.points} puntos`}
            style={[
              styles.row,
              index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 },
              leader && { backgroundColor: theme.brandMuted },
            ]}>
            <ThemedText
              type="smallBold"
              themeColor={leader ? 'brand' : 'textSecondary'}
              style={styles.position}>
              {row.position}
            </ThemedText>

            <View style={styles.team}>
              <TeamBadge name={row.team.name} logo={row.team.logo} size={22} />
              <View style={styles.teamText}>
                <ThemedText type="small" numberOfLines={1}>
                  {row.team.name}
                </ThemedText>
                <FormStrip form={row.form} />
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.played}>
              {row.played}
            </ThemedText>
            <ThemedText type="small" style={styles.difference}>
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.points}>
              {row.points}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  teamHeader: {
    flex: 1,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  teamText: {
    flex: 1,
    gap: 2,
  },
  played: {
    width: 26,
    textAlign: 'center',
  },
  difference: {
    width: 34,
    textAlign: 'center',
  },
  points: {
    width: 30,
    textAlign: 'right',
  },
});
