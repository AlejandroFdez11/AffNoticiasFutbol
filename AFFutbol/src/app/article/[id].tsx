import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/lib/format';

import { useNewsFeed, useNewsItem } from '@/features/news/api';
import { ArticleCard } from '@/features/news/components/article-card';
import { RumorCard } from '@/features/news/components/rumor-card';
import { RumorStatusBadge } from '@/features/news/components/rumor-status-badge';
import { TopicBadge } from '@/features/news/components/topic-badge';
import { TransferSummary } from '@/features/news/components/transfer-summary';
import type { FeedArticle, FeedItem } from '@/features/news/types';

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' && params.id.length > 0 ? params.id : null;

  const itemQuery = useNewsItem(id);
  const feedQuery = useNewsFeed();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/news'));

  const header = (title: string) => (
    <ScreenHeader
      eyebrow="AFFutbol"
      title={title}
      right={
        <IconButton
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          label="Volver"
          onPress={goBack}
        />
      }
    />
  );

  if (id === null) {
    return (
      <Screen>
        {header('Noticia')}
        <EmptyState
          icon={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' }}
          title="Contenido no válido"
          description="No hemos podido identificar la noticia que quieres abrir."
        />
      </Screen>
    );
  }

  if (itemQuery.isPending) {
    return (
      <Screen>
        {header('Noticia')}
        <LoadingState message="Cargando contenido…" />
      </Screen>
    );
  }

  if (itemQuery.isError) {
    return (
      <Screen>
        {header('Noticia')}
        <ErrorState
          title="No se pudo cargar el contenido"
          message={
            itemQuery.error instanceof Error
              ? itemQuery.error.message
              : 'Inténtalo de nuevo en unos segundos.'
          }
          onRetry={() => void itemQuery.refetch()}
        />
      </Screen>
    );
  }

  const item = itemQuery.data;

  if (!item) {
    return (
      <Screen>
        {header('Noticia')}
        <EmptyState
          icon={{ ios: 'doc.text.magnifyingglass', android: 'search_off', web: 'search_off' }}
          title="Noticia no encontrada"
          description="Puede que el contenido haya salido de la ventana de 14 días que guarda la app."
        />
      </Screen>
    );
  }

  const related = (feedQuery.data?.items ?? [])
    .filter((candidate) => candidate.id !== item.id && candidate.topic === item.topic)
    .slice(0, 3);

  const sourceUrl = item.sourceUrl;

  return (
    <Screen>
      {header(item.kind === 'rumor' ? 'Rumor' : 'Noticia')}

      <View style={styles.meta}>
        {item.kind === 'rumor' ? <RumorStatusBadge status={item.status} /> : null}
        <TopicBadge topic={item.topic} />
        <View style={styles.spacer} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(item.publishedAt)}
        </ThemedText>
      </View>

      <ThemedText style={styles.title}>{item.title}</ThemedText>

      {item.summary ? (
        <ThemedText style={styles.lead} themeColor="textSecondary">
          {item.summary}
        </ThemedText>
      ) : null}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {item.kind === 'rumor' && (item.player || item.from || item.to || item.fee) ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {item.player ? <ThemedText type="smallBold">{item.player}</ThemedText> : null}
          <TransferSummary rumor={item} />
        </View>
      ) : null}

      {item.body && item.body.length > 0 ? (
        <View style={styles.body}>
          {item.body.map((paragraph, index) => (
            <ThemedText key={`${item.id}-${index}`} style={styles.paragraph}>
              {paragraph}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {item.kind === 'rumor' ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: theme.brandMuted, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Información de mercado
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Este contenido lo publica {item.source} y describe un rumor, no un fichaje
            confirmado.
          </ThemedText>
        </View>
      ) : null}

      <View
        style={[
          styles.sourceCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <ThemedText type="smallBold">{item.source}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.author ? `Por ${item.author} · ` : ''}
          {formatRelativeTime(item.publishedAt)}
        </ThemedText>
        {sourceUrl ? (
          <Button
            label={`Abrir en ${item.source}`}
            variant="secondary"
            onPress={() => void WebBrowser.openBrowserAsync(sourceUrl)}
          />
        ) : null}
      </View>

      {related.length > 0 ? (
        <View style={styles.related}>
          <View style={styles.relatedHeading}>
            <ThemedText type="smallBold">Más sobre {item.topic}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {related.length} {related.length === 1 ? 'contenido' : 'contenidos'}
            </ThemedText>
          </View>
          {related.map((candidate) => (
            <RelatedCard key={candidate.id} item={candidate} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function RelatedCard({ item }: { item: FeedItem }) {
  return item.kind === 'rumor' ? <RumorCard item={item} /> : <ArticleCard item={item as FeedArticle} />;
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 700,
  },
  lead: {
    fontSize: 18,
    lineHeight: 27,
  },
  divider: {
    height: 1,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  body: {
    gap: Spacing.three,
  },
  paragraph: {
    lineHeight: 26,
  },
  notice: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  sourceCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  related: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  relatedHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
