import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/lib/format';

import type { FeedArticle } from '../types';
import { TopicBadge } from './topic-badge';

type ArticleCardProps = {
  item: FeedArticle;
  featured?: boolean;
};

export function ArticleCard({ item, featured = false }: ArticleCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Leer: ${item.title}`}
      onPress={() =>
        router.push({ pathname: '/article/[id]', params: { id: item.id } })
      }
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: featured ? theme.brand : theme.border,
        },
        featured && styles.featured,
        pressed && styles.pressed,
      ]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.image, { backgroundColor: theme.border }]}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <View style={styles.meta}>
        <TopicBadge topic={item.topic} />
        {featured ? (
          <View style={[styles.featuredBadge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Destacado
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.spacer} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(item.publishedAt)}
        </ThemedText>
      </View>

      <ThemedText style={[styles.title, featured && styles.titleFeatured]}>
        {item.title}
      </ThemedText>

      {item.summary ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          numberOfLines={featured ? 3 : 2}>
          {item.summary}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        {item.author ? `${item.source} · ${item.author}` : item.source}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  featured: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.medium,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featuredBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 700,
  },
  titleFeatured: {
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.7,
  },
});
