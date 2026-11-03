import type { User } from '@supabase/supabase-js';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatMemberSince, getAuthProvider, getProfileDisplayName, getProviderLabel } from '../format';
import { getProfileInitials, type Profile } from '../types';

type ProfileSummaryProps = {
  user: User;
  profile: Profile | null;
};

export function ProfileSummary({ user, profile }: ProfileSummaryProps) {
  const theme = useTheme();
  const displayName = getProfileDisplayName(profile, user);
  const provider = getAuthProvider(user);
  const memberSince = formatMemberSince(profile?.createdAt ?? user.created_at);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Avatar
          name={getProfileInitials(profile, displayName)}
          uri={profile?.avatarUrl}
          size={64}
        />
        <View style={styles.identity}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {displayName}
          </ThemedText>
          {profile?.username ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              @{profile.username}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {user.email}
          </ThemedText>
        </View>
      </View>

      <View style={styles.meta}>
        <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>
            {getProviderLabel(provider)}
          </ThemedText>
        </View>
        {memberSince ? (
          <ThemedText type="small" themeColor="textSecondary">
            {memberSince}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  identity: {
    flex: 1,
    gap: Spacing.half,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radii.pill,
  },
});
