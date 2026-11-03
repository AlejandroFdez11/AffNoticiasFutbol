import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, EmptyState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { env } from '@/lib/env';
import { formatLongDate, toDateKey } from '@/lib/format';
import { describeApiFootballError } from '@/services/api-football/client';
import type { Fixture } from '@/services/api-football/types';

import { useFixturesByDate } from '@/features/matches/api';
import { AUTO_EXPAND_THRESHOLD } from '@/features/matches/constants';
import { DateStrip } from '@/features/matches/components/date-strip';
import { MatchRow } from '@/features/matches/components/match-row';
import { SectionHeader } from '@/features/matches/components/section-header';
import { groupFixturesByLeague, getLiveFixtures } from '@/features/matches/grouping';
import { isLiveMatch } from '@/features/matches/mappers';

type MatchSection = {
  key: string;
  kind: 'live' | 'league';
  title: string;
  subtitle?: string;
  logo?: string;
  data: Fixture[];
  totalCount: number;
  liveCount: number;
  collapsible: boolean;
  expanded: boolean;
};

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data, dataUpdatedAt, error, isError, isPending, isRefetching, refetch } =
    useFixturesByDate(toDateKey(selectedDate));

  const fixtures = useMemo(() => data ?? [], [data]);

  const sections = useMemo<MatchSection[]>(() => {
    const liveFixtures = getLiveFixtures(fixtures);
    const leagueGroups = groupFixturesByLeague(fixtures)
      .map((group) => ({
        ...group,
        matches: group.matches.filter((fixture) => !isLiveMatch(fixture)),
      }))
      .filter((group) => group.matches.length > 0);
    const autoExpand = fixtures.length <= AUTO_EXPAND_THRESHOLD;

    const result: MatchSection[] = [];

    if (liveFixtures.length > 0) {
      result.push({
        key: 'live',
        kind: 'live',
        title: 'En directo',
        data: liveFixtures,
        totalCount: liveFixtures.length,
        liveCount: 0,
        collapsible: false,
        expanded: true,
      });
    }

    for (const group of leagueGroups) {
      const key = `league-${group.league.id}`;
      const expanded = expandedSections[key] ?? autoExpand;

      result.push({
        key,
        kind: 'league',
        title: group.league.name,
        subtitle: group.league.country,
        logo: group.league.logo,
        data: expanded ? group.matches : [],
        totalCount: group.matches.length,
        liveCount: group.liveCount,
        collapsible: true,
        expanded,
      });
    }

    return result;
  }, [fixtures, expandedSections]);

  const toggleSection = (key: string) => {
    setExpandedSections((previous) => {
      const autoExpand = fixtures.length <= AUTO_EXPAND_THRESHOLD;
      const current = previous[key] ?? autoExpand;
      return { ...previous, [key]: !current };
    });
  };

  const updatedAt = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm') : null;
  const emptyContent = isPending ? (
    <LoadingState message="Cargando partidos…" />
  ) : isError ? (
    <ErrorState message={describeApiFootballError(error)} onRetry={() => void refetch()} />
  ) : (
    <EmptyState
      icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
      title="No hay partidos"
      description={`No hay encuentros de las competiciones incluidas para el ${formatLongDate(selectedDate).toLowerCase()}.`}
    />
  );

  return (
    <Screen scroll={false}>
      <SectionList<Fixture, MatchSection>
        sections={sections}
        keyExtractor={(item) => String(item.fixture.id)}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.brand}
            colors={[theme.brand]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              eyebrow="AFFutbol"
              title="Partidos"
              subtitle={formatLongDate(selectedDate)}
              right={
                <View style={styles.headerActions}>
                  <IconButton
                    icon={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
                    label="Ver estadísticas"
                    onPress={() => router.push('/statistics')}
                  />
                  <IconButton
                    icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                    label="Actualizar partidos"
                    busy={isRefetching}
                    onPress={() => void refetch()}
                  />
                </View>
              }
            />

            {env.useMocks ? (
              <View style={[styles.demo, { backgroundColor: theme.brandMuted }]}>
                <ThemedText type="small" style={{ color: theme.brand }}>
                  Datos simulados · pon EXPO_PUBLIC_USE_MOCKS=false para usar la API real
                </ThemedText>
              </View>
            ) : null}

            <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            subtitle={section.subtitle}
            logo={section.logo}
            count={section.totalCount}
            liveCount={section.liveCount}
            collapsible={section.collapsible}
            expanded={section.expanded}
            onToggle={() => toggleSection(section.key)}
          />
        )}
        renderItem={({ item, section }) => (
          <View style={styles.rowWrapper}>
            <MatchRow fixture={item} showLeague={section.kind === 'live'} />
          </View>
        )}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={
          fixtures.length > 0 ? (
            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                {fixtures.length} {fixtures.length === 1 ? 'partido' : 'partidos'}
                {updatedAt ? ` · Actualizado a las ${updatedAt}` : ''}
              </ThemedText>
            </View>
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  demo: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.medium,
  },
  rowWrapper: {
    paddingBottom: Spacing.two,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
});
