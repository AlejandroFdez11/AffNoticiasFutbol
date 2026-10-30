import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Fixture, FixtureTeam } from '@/services/api-football/types';

import { formatMatchTime } from '@/lib/format';

import { getMatchPhase, getMatchStatusLabel, hasScore } from '../mappers';

type MatchRowProps = {
  fixture: Fixture;
  /** Shows the league name above the teams (used in the "En directo" block). */
  showLeague?: boolean;
};

export function MatchRow({ fixture, showLeague }: MatchRowProps) {
  const theme = useTheme();
  const router = useRouter();
  const phase = getMatchPhase(fixture);
  const live = phase === 'live';
  const scored = hasScore(fixture);

  const home = fixture.teams.home;
  const away = fixture.teams.away;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${home.name} contra ${away.name}`}
      onPress={() =>
        router.push({
          pathname: '/match/[id]',
          params: { id: String(fixture.fixture.id) },
        })
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {showLeague ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {fixture.league.name}
        </ThemedText>
      ) : null}

      <View style={styles.body}>
        <View style={styles.statusColumn}>
          {live ? (
            <View style={styles.live}>
              <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
              <ThemedText type="smallBold" style={{ color: theme.live }}>
                {getMatchStatusLabel(fixture)}
              </ThemedText>
            </View>
          ) : (
            <ThemedText
              type="smallBold"
              themeColor={phase === 'scheduled' ? 'text' : 'textSecondary'}>
              {phase === 'scheduled'
                ? formatMatchTime(fixture.fixture.date)
                : getMatchStatusLabel(fixture)}
            </ThemedText>
          )}
        </View>

        <View style={styles.teams}>
          <TeamLine
            team={home}
            score={scored ? fixture.goals.home : null}
            winner={home.winner}
          />
          <TeamLine
            team={away}
            score={scored ? fixture.goals.away : null}
            winner={away.winner}
          />
        </View>
      </View>
    </Pressable>
  );
}

type TeamLineProps = {
  team: FixtureTeam;
  score: number | null;
  winner: boolean | null;
};

function TeamLine({ team, score, winner }: TeamLineProps) {
  const theme = useTheme();

  return (
    <View style={styles.teamLine}>
      {team.logo ? (
        <Image source={{ uri: team.logo }} style={styles.logo} contentFit="contain" />
      ) : (
        <View style={[styles.logo, styles.logoFallback, { backgroundColor: theme.brandMuted }]} />
      )}
      <ThemedText
        type="small"
        numberOfLines={1}
        themeColor={winner === false ? 'textSecondary' : 'text'}
        style={[styles.teamName, winner === true && styles.winner]}>
        {team.name}
      </ThemedText>
      <ThemedText
        type="smallBold"
        style={[styles.score, winner === false && { color: theme.textSecondary }]}>
        {score ?? ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  statusColumn: {
    width: 66,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.pill,
  },
  teams: {
    flex: 1,
    gap: Spacing.one,
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 20,
    height: 20,
  },
  logoFallback: {
    borderRadius: Radii.pill,
  },
  teamName: {
    flex: 1,
  },
  winner: {
    fontWeight: 700,
  },
  score: {
    width: 18,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.7,
  },
});
