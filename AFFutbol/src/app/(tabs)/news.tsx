import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useNewsFeed } from '@/features/news/api';
import { ArticleCard } from '@/features/news/components/article-card';
import { RumorCard } from '@/features/news/components/rumor-card';
import { NEWS_FILTERS } from '@/features/news/constants';
import { filterFeed } from '@/features/news/feed';
import type { FeedArticle, FeedItem, NewsFilter } from '@/features/news/types';

export default function NewsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<NewsFilter>('all');

  const { data, error, isError, isPending, isRefetching, refetch } = useNewsFeed();

  const items = useMemo(() => filterFeed(data ?? [], filter), [data, filter]);

  const featured = useMemo(
    () =>
      filter === 'all'
        ? items.find(
            (item): item is FeedArticle => item.kind === 'news' && Boolean(item.featured)
          )
        : undefined,
    [filter, items]
  );

  const listItems = useMemo(
    () => (featured ? items.filter((item) => item.id !== featured.id) : items),
    [featured, items]
  );

  const heading =
    filter === 'rumor'
      ? 'Rumores de fichajes'
      : filter === 'news'
        ? 'Últimas noticias'
        : featured
          ? 'Más actualidad'
          : 'Toda la actualidad';

  const emptyContent = isPending ? (
    <LoadingState message="Cargando noticias…" />
  ) : isError ? (
    <ErrorState
      title="No se pudieron cargar las noticias"
      message={
        error instanceof Error ? error.message : 'Inténtalo de nuevo en unos segundos.'
      }
      onRetry={() => void refetch()}
    />
  ) : (
    <EmptyState
      icon={{ ios: 'newspaper', android: 'newspaper', web: 'newspaper' }}
      title="Sin contenido"
      description="No hay noticias ni rumores que mostrar por ahora."
    />
  );

  return (
    <Screen scroll={false}>
      <FlatList<FeedItem>
        data={listItems}
        keyExtractor={(item) => item.id}
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
              title="Noticias"
              subtitle="Actualidad, análisis y mercado"
              right={
                <View style={styles.headerActions}>
                  <IconButton
                    icon={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
                    label="Ver estadísticas"
                    onPress={() => router.push('/statistics')}
                  />
                  <IconButton
                    icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                    label="Actualizar noticias"
                    busy={isRefetching}
                    onPress={() => void refetch()}
                  />
                </View>
              }
            />

            <View style={[styles.demo, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="small" style={{ color: theme.brand }}>
                Contenido de muestra · noticias y rumores de ejemplo hasta conectar la fuente real
              </ThemedText>
            </View>

            <SegmentedControl options={NEWS_FILTERS} value={filter} onChange={setFilter} />

            {featured ? <ArticleCard item={featured} featured /> : null}

            {!isPending && !isError ? (
              <View style={styles.listHeading}>
                <ThemedText type="smallBold">{heading}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {listItems.length} {listItems.length === 1 ? 'contenido' : 'contenidos'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrapper}>
            {item.kind === 'rumor' ? <RumorCard item={item} /> : <ArticleCard item={item} />}
          </View>
        )}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                {items.length} {items.length === 1 ? 'contenido' : 'contenidos'} · contenido de
                muestra
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
  listHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  rowWrapper: {
    paddingBottom: Spacing.two,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
});
