import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ContentTopic } from '../types';

export function TopicBadge({ topic }: { topic: ContentTopic }) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
      <ThemedText type="smallBold" style={{ color: theme.brand }}>
        {topic}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
});
