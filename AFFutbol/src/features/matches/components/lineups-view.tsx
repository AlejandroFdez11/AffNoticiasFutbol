import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FixtureLineup, LineupPlayer } from '@/services/api-football/types';

import { getLineupPlayerKey } from '../lineups';

const POSITION_LABELS: Record<string, string> = {
  G: 'POR',
  D: 'DEF',
  M: 'MED',
  F: 'DEL',
};

export function LineupsView({ lineups }: { lineups: FixtureLineup[] }) {
  return (
    <View style={styles.container}>
      {lineups.map((lineup, index) => (
        <LineupCard key={`${lineup.team.id}-${index}`} lineup={lineup} />
      ))}
    </View>
  );
}

function LineupCard({ lineup }: { lineup: FixtureLineup }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        {lineup.team.logo ? (
          <Image source={{ uri: lineup.team.logo }} style={styles.logo} contentFit="contain" />
        ) : null}
        <View style={styles.headerText}>
          <ThemedText type="smallBold">{lineup.team.name}</ThemedText>
          {lineup.coach.name ? (
            <ThemedText type="small" themeColor="textSecondary">
              Entrenador: {lineup.coach.name}
            </ThemedText>
          ) : null}
        </View>
        {lineup.formation ? (
          <View style={[styles.formation, { backgroundColor: theme.brandMuted }]}>
            <ThemedText type="smallBold" style={{ color: theme.brand }}>
              {lineup.formation}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <PlayerList title="Titulares" players={lineup.startXI.map((item) => item.player)} />
      <PlayerList title="Suplentes" players={lineup.substitutes.map((item) => item.player)} />
    </View>
  );
}

function PlayerList({ title, players }: { title: string; players: LineupPlayer[] }) {
  const theme = useTheme();

  if (players.length === 0) return null;

  return (
    <View style={styles.list}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {players.map((player, index) => (
        <View key={getLineupPlayerKey(player, index)} style={styles.player}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.number}>
            {player.number}
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={styles.playerName}>
            {player.name}
          </ThemedText>
          <View style={[styles.position, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {POSITION_LABELS[player.pos] ?? player.pos}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
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
  logo: {
    width: 28,
    height: 28,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  formation: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  list: {
    gap: Spacing.one,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  number: {
    width: 22,
    textAlign: 'right',
  },
  playerName: {
    flex: 1,
  },
  position: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Radii.small,
  },
});
