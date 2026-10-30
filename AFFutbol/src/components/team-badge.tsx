import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type TeamBadgeProps = {
  name: string;
  logo?: string;
  size?: number;
};

/**
 * Round badge with the club crest and its initial as a fallback, so cards keep
 * looking right when a logo cannot be loaded.
 */
export function TeamBadge({ name, logo, size = 24 }: TeamBadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: Radii.pill,
          backgroundColor: theme.brandMuted,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: theme.brand, fontSize: Math.round(size * 0.45) }}>
        {name.charAt(0).toUpperCase()}
      </ThemedText>
      {logo ? <Image source={{ uri: logo }} style={styles.image} contentFit="contain" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
