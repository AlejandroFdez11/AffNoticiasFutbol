import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { AvatarColor } from '../account-profiles';
import { getAvatar, type AvatarId } from '../avatars';

type AccountProfileAvatarProps = {
  avatarId: AvatarId;
  color: AvatarColor;
  size?: number;
  active?: boolean;
};

/** The big rounded tile used by the Netflix-style profile picker. */
export function AccountProfileAvatar({
  avatarId,
  color,
  size = 88,
  active = false,
}: AccountProfileAvatarProps) {
  const theme = useTheme();
  const avatar = getAvatar(avatarId);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: Radii.large,
          backgroundColor: theme[color],
          borderColor: active ? theme.text : 'transparent',
        },
      ]}>
      <SymbolView
        name={avatar.symbol}
        size={Math.round(size * 0.5)}
        tintColor={theme.inverseText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
