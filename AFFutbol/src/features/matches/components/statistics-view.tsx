import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FixtureTeam, FixtureTeamStatistics } from '@/services/api-football/types';

import { buildStatRows } from '../statistics';

export function StatisticsView({
  home,
  away,
}: {
  home?: FixtureTeamStatistics;
  away?: FixtureTeamStatistics;
}) {
  const theme = useTheme();
  const rows = buildStatRows(home, away);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <TeamLabel team={home?.team} />
        <ThemedText type="smallBold">Estadísticas</ThemedText>
        <TeamLabel team={away?.team} align="right" />
      </View>

      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.values}>
            <ThemedText type="smallBold" style={styles.value}>
              {row.home}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              {row.label}
            </ThemedText>
            <ThemedText type="smallBold" style={[styles.value, styles.valueRight]}>
              {row.away}
            </ThemedText>
          </View>

          {row.homeShare !== null ? (
            <View style={[styles.track, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${row.homeShare}%`, backgroundColor: theme.brand },
                ]}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function TeamLabel({ team, align = 'left' }: { team?: FixtureTeam; align?: 'left' | 'right' }) {
  if (!team) return <View style={styles.teamLabel} />;

  return (
    <View style={[styles.teamLabel, align === 'right' && styles.teamLabelRight]}>
      {team.logo ? (
        <Image source={{ uri: team.logo }} style={styles.logo} contentFit="contain" />
      ) : null}
      <ThemedText type="small" numberOfLines={1} style={styles.teamName}>
        {team.name}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  teamLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  teamLabelRight: {
    flexDirection: 'row-reverse',
  },
  logo: {
    width: 20,
    height: 20,
  },
  teamName: {
    flexShrink: 1,
  },
  row: {
    gap: Spacing.one,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  value: {
    width: 48,
  },
  valueRight: {
    textAlign: 'right',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
});
