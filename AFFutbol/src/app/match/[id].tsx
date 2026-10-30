import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeApiFootballError } from '@/services/api-football/client';

import {
  useFixtureDetail,
  useFixtureEvents,
  useFixtureLineups,
  useFixtureStatistics,
} from '@/features/matches/api';
import { EventTimeline } from '@/features/matches/components/event-timeline';
import { LineupsView } from '@/features/matches/components/lineups-view';
import { Scoreboard } from '@/features/matches/components/scoreboard';
import { StatisticsView } from '@/features/matches/components/statistics-view';
import { MATCH_TABS, type MatchTabKey } from '@/features/matches/constants';

export default function MatchDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const parsedId = params.id ? Number(params.id) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const [tab, setTab] = useState<MatchTabKey>('summary');

  const detail = useFixtureDetail(id);
  const eventsQuery = useFixtureEvents(id, tab === 'summary');
  const lineupsQuery = useFixtureLineups(id, tab === 'lineups');
  const statisticsQuery = useFixtureStatistics(id, tab === 'statistics');
  const activeQuery =
    tab === 'summary' ? eventsQuery : tab === 'lineups' ? lineupsQuery : statisticsQuery;

  if (id === null) {
    return (
      <Screen>
        <ScreenHeader eyebrow="AFFutbol" title="Partido" right={<BackButton />} />
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Partido no válido</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            No hemos podido identificar el partido que quieres abrir.
          </ThemedText>
        </View>
      </Screen>
    );
  }

  if (detail.isPending) {
    return (
      <Screen>
        <ScreenHeader eyebrow="AFFutbol" title="Partido" right={<BackButton />} />
        <LoadingState message="Cargando detalle del partido…" />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <ScreenHeader eyebrow="AFFutbol" title="Partido" right={<BackButton />} />
        <ErrorState
          message={describeApiFootballError(detail.error)}
          onRetry={() => void detail.refetch()}
        />
      </Screen>
    );
  }

  const fixture = detail.data;

  return (
    <Screen>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Partido"
        right={
          <View style={styles.headerActions}>
            <RefreshButton
              busy={detail.isFetching || activeQuery.isFetching}
              onPress={() => {
                void detail.refetch();
                void activeQuery.refetch();
              }}
            />
            <BackButton />
          </View>
        }
      />

      <Scoreboard fixture={fixture} />

      <SegmentedControl options={MATCH_TABS} value={tab} onChange={setTab} />

      {tab === 'summary' ? (
        eventsQuery.isPending ? (
          <LoadingState message="Cargando eventos…" />
        ) : eventsQuery.isError ? (
          <ErrorState
            message={describeApiFootballError(eventsQuery.error)}
            onRetry={() => void eventsQuery.refetch()}
          />
        ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
          <EventTimeline events={eventsQuery.data} />
        ) : (
          <UnavailableCard text="Todavía no hay goles, tarjetas ni cambios que mostrar." />
        )
      ) : null}

      {tab === 'lineups' ? (
        lineupsQuery.isPending ? (
          <LoadingState message="Cargando alineaciones…" />
        ) : lineupsQuery.isError ? (
          <ErrorState
            message={describeApiFootballError(lineupsQuery.error)}
            onRetry={() => void lineupsQuery.refetch()}
          />
        ) : lineupsQuery.data && lineupsQuery.data.length > 0 ? (
          <LineupsView lineups={lineupsQuery.data} />
        ) : (
          <UnavailableCard text="La API-Football no ha publicado las alineaciones de este partido." />
        )
      ) : null}

      {tab === 'statistics' ? (
        statisticsQuery.isPending ? (
          <LoadingState message="Cargando estadísticas…" />
        ) : statisticsQuery.isError ? (
          <ErrorState
            message={describeApiFootballError(statisticsQuery.error)}
            onRetry={() => void statisticsQuery.refetch()}
          />
        ) : statisticsQuery.data && statisticsQuery.data.length > 0 ? (
          <StatisticsView
            home={statisticsQuery.data.find((item) => item.team.id === fixture.teams.home.id)}
            away={statisticsQuery.data.find((item) => item.team.id === fixture.teams.away.id)}
          />
        ) : (
          <UnavailableCard text="La API-Football no ha publicado estadísticas de este partido." />
        )
      ) : null}
    </Screen>
  );
}

function BackButton() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={18}
        tintColor={theme.brand}
      />
    </Pressable>
  );
}

function RefreshButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Actualizar partido"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={theme.brand} />
      ) : (
        <SymbolView
          name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
          size={18}
          tintColor={theme.brand}
        />
      )}
    </Pressable>
  );
}

function UnavailableCard({ text }: { text: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  action: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
