import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  logo?: string;
  count: number;
  liveCount?: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
};

export function SectionHeader({
  title,
  subtitle,
  logo,
  count,
  liveCount = 0,
  collapsible = false,
  expanded = true,
  onToggle,
}: SectionHeaderProps) {
  const theme = useTheme();
  const countLabel = `${count} ${count === 1 ? 'partido' : 'partidos'}`;

  const content = (
    <>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.logo} contentFit="contain" />
      ) : null}

      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitle ? `${subtitle} · ${countLabel}` : countLabel}
        </ThemedText>
      </View>

      {liveCount > 0 ? (
        <View style={styles.live}>
          <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
          <ThemedText type="smallBold" style={{ color: theme.live }}>
            {liveCount}
          </ThemedText>
        </View>
      ) : null}

      {collapsible ? (
        <SymbolView
          name={{
            ios: expanded ? 'chevron.down' : 'chevron.right',
            android: expanded ? 'expand_more' : 'chevron_right',
            web: expanded ? 'expand_more' : 'chevron_right',
          }}
          size={16}
          tintColor={theme.textSecondary}
        />
      ) : null}
    </>
  );

  if (!collapsible) {
    return <View style={styles.header}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  logo: {
    width: 22,
    height: 22,
  },
  text: {
    flex: 1,
    gap: 1,
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
  pressed: {
    opacity: 0.7,
  },
});
