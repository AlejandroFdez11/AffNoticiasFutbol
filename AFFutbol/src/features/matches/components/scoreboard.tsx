import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Fixture, FixtureTeam } from '@/services/api-football/types';

import { getPenaltyScore, hasScore } from '../mappers';
import { MatchStatusBadge } from './match-status-badge';

export function Scoreboard({ fixture }: { fixture: Fixture }) {
  const theme = useTheme();
  const scored = hasScore(fixture);
  const penalties = getPenaltyScore(fixture);
  const venue = fixture.fixture.venue.name
    ? [fixture.fixture.venue.name, fixture.fixture.venue.city].filter(Boolean).join(' · ')
    : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.league}>
        {fixture.league.name} · {fixture.league.round}
      </ThemedText>

      <View style={styles.teams}>
        <TeamColumn team={fixture.teams.home} />

        <View style={styles.middle}>
          <ThemedText style={styles.score}>
            {scored ? `${fixture.goals.home} - ${fixture.goals.away}` : 'vs'}
          </ThemedText>
          <MatchStatusBadge fixture={fixture} />
          {penalties ? (
            <ThemedText type="small" themeColor="textSecondary">
              Penaltis {penalties.home} - {penalties.away}
            </ThemedText>
          ) : null}
        </View>

        <TeamColumn team={fixture.teams.away} />
      </View>

      {venue ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.venue}>
          {venue}
        </ThemedText>
      ) : null}
    </View>
  );
}

function TeamColumn({ team }: { team: FixtureTeam & { winner?: boolean | null } }) {
  const theme = useTheme();

  return (
    <View style={styles.team}>
      {team.logo ? (
        <Image source={{ uri: team.logo }} style={styles.logo} contentFit="contain" />
      ) : (
        <View style={[styles.logo, styles.logoFallback, { backgroundColor: theme.brandMuted }]} />
      )}
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[styles.teamName, team.winner === true && styles.winner]}>
        {team.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  league: {
    textAlign: 'center',
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 56,
    height: 56,
  },
  logoFallback: {
    borderRadius: Radii.pill,
  },
  teamName: {
    textAlign: 'center',
  },
  winner: {
    fontWeight: 700,
  },
  middle: {
    width: 96,
    alignItems: 'center',
    gap: Spacing.two,
  },
  score: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 700,
  },
  venue: {
    textAlign: 'center',
  },
});
