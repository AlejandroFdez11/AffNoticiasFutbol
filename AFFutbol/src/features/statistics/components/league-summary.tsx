import { StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LeagueSummary } from '../types';
import { teamLabel } from '../logic';

function goalsPerMatch(value: number) {
  return value.toFixed(2).replace('.', ',');
}

export function LeagueSummaryCard({ summary }: { summary: LeagueSummary }) {
  const theme = useTheme();
  const leaderLabel = teamLabel(summary.leader.team);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.leader}>
        <View style={styles.leaderText}>
          <ThemedText type="small" themeColor="textSecondary">
            Líder
          </ThemedText>
          <View style={styles.leaderTeam}>
            <TeamBadge
              name={leaderLabel}
              logo={summary.leader.team.logo}
              size={26}
            />
            <ThemedText type="smallBold" numberOfLines={1} style={styles.leaderName}>
              {leaderLabel}
            </ThemedText>
          </View>
        </View>
        <View style={styles.leaderPoints}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>
            {summary.leader.points}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            puntos
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.tiles}>
        <StatTile label="Partidos" value={String(summary.matches)} />
        <StatTile label="Goles" value={String(summary.goals)} />
        <StatTile label="Media" value={goalsPerMatch(summary.goalsPerMatch)} />
      </View>

      <View style={styles.leaders}>
        <LeaderRow
          label="Mejor ataque"
          team={teamLabel(summary.bestAttack.team)}
          value={`${summary.bestAttack.goalsFor} goles`}
        />
        <LeaderRow
          label="Mejor defensa"
          team={teamLabel(summary.bestDefense.team)}
          value={`${summary.bestDefense.goalsAgainst} encajados`}
        />
      </View>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function LeaderRow({ label, team, value }: { label: string; team: string; value: string }) {
  return (
    <View style={styles.leaderRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" numberOfLines={1} style={styles.leaderRowTeam}>
        {team}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  leader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  leaderText: {
    flex: 1,
    gap: Spacing.one,
  },
  leaderTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  leaderName: {
    flexShrink: 1,
    fontSize: 16,
  },
  leaderPoints: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: Radii.medium,
  },
  leaders: {
    gap: Spacing.one,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  leaderRowTeam: {
    flex: 1,
    textAlign: 'right',
  },
});
