import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/lib/format';

import type { FeedRumor } from '../types';
import { RumorStatusBadge } from './rumor-status-badge';
import { TransferSummary } from './transfer-summary';

export function RumorCard({ item }: { item: FeedRumor }) {
  const theme = useTheme();
  const router = useRouter();

  const credit = item.player ? `${item.source} · ${item.player}` : item.source;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Leer rumor: ${item.title}`}
      onPress={() =>
        router.push({ pathname: '/article/[id]', params: { id: item.id } })
      }
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.meta}>
        <RumorStatusBadge status={item.status} />
        <View style={styles.spacer} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(item.publishedAt)}
        </ThemedText>
      </View>

      <ThemedText style={styles.title}>{item.title}</ThemedText>

      {item.summary ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {item.summary}
        </ThemedText>
      ) : null}

      <TransferSummary rumor={item} />

      <ThemedText type="small" themeColor="textSecondary">
        {credit}
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
