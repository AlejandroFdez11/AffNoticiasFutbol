import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useLeagueSnapshot } from '@/features/statistics/api';
import { LeagueSummaryCard } from '@/features/statistics/components/league-summary';
import { ScorersList } from '@/features/statistics/components/scorers-list';
import { StandingsTable } from '@/features/statistics/components/standings-table';
import { LEAGUE_OPTIONS } from '@/features/statistics/constants';
import type { LeagueId } from '@/features/statistics/types';

export default function StatisticsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<LeagueId>('laliga');

  const query = useLeagueSnapshot(leagueId);
  const data = query.data;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Estadísticas"
        subtitle={
          data
            ? `${data.league.name} · Temporada ${data.league.season}`
            : 'Clasificación, goleadores y datos de la competición'
        }
        right={
          <IconButton
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            label="Volver"
            onPress={goBack}
          />
        }
      />

      <SegmentedControl options={LEAGUE_OPTIONS} value={leagueId} onChange={setLeagueId} />

      {query.isPending ? (
        <LoadingState message="Cargando estadísticas…" />
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar las estadísticas"
          message={
            query.error instanceof Error
              ? query.error.message
              : 'Inténtalo de nuevo en unos segundos.'
          }
          onRetry={() => void query.refetch()}
        />
      ) : data ? (
        <>
          {data.isSample ? (
            <View style={[styles.demo, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="small" style={{ color: theme.brand }}>
                Datos de muestra · la clasificación real aparecerá cuando el servicio de
                estadísticas publique la temporada
              </ThemedText>
            </View>
          ) : null}

          <LeagueSummaryCard summary={data.summary} />

          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold">Clasificación</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {data.league.country}
            </ThemedText>
          </View>
          <StandingsTable standings={data.standings} />

          <ScorersList scorers={data.scorers} />

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {data.isSample
                ? `Temporada ${data.league.season} · datos de muestra`
                : `Temporada ${data.league.season} · football-data.org · Wikipedia`}
            </ThemedText>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.medium,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
});
