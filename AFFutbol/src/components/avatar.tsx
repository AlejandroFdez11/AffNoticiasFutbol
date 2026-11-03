import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({ name, uri, size = 64 }: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: Radii.pill,
          backgroundColor: theme.brandMuted,
        },
      ]}>
      <ThemedText
        type="subtitle"
        style={{ color: theme.brand, fontSize: Math.round(size * 0.36), lineHeight: size }}>
        {name}
      </ThemedText>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
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
