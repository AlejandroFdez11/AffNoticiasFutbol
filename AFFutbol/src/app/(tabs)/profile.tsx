import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/state-card';
import { SupabaseSetupCard } from '@/components/supabase-setup-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { describeAuthError, useAuth } from '@/features/auth/auth-context';
import { LegalLinks } from '@/features/legal/components/legal-links';
import { NotificationsCard } from '@/features/notifications/components/notifications-card';
import { usePredictionSummary } from '@/features/predictions/api';
import { AccountProfileAvatar } from '@/features/profile/components/account-profile-avatar';
import { FavoriteTeamCard } from '@/features/profile/components/favorite-team-card';
import { PointsSummary } from '@/features/profile/components/points-summary';
import { ProfileHero } from '@/features/profile/components/profile-hero';
import { ProfileSummary } from '@/features/profile/components/profile-summary';
import { getProfileDisplayName } from '@/features/profile/format';
import { findTeamOption } from '@/features/profile/teams';
import { useActiveProfile } from '@/features/profile/use-account-profiles';
import { useGlobalRanking } from '@/features/rankings/api';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    status,
    isConfigured,
    user,
    profile,
    profileError,
    signOut,
    refreshProfile,
  } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const predictionsQuery = usePredictionSummary();
  const rankingQuery = useGlobalRanking();
  const activeProfile = useActiveProfile();
  const myRank = rankingQuery.data?.find((entry) => entry.isMe)?.rank ?? null;

  const handleSignOut = async () => {
    setActionError(null);

    try {
      await signOut();
    } catch (error) {
      setActionError(describeAuthError(error));
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Perfil"
        subtitle={
          status === 'authenticated' && user
            ? `Hola, ${getProfileDisplayName(profile, user)}`
            : 'Tu cuenta, tu equipo y tus puntos.'
        }
        right={
          status === 'authenticated' ? (
            <IconButton
              icon={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
              label="Editar perfil"
              onPress={() => router.push('/edit-profile')}
            />
          ) : undefined
        }
      />

      {!isConfigured ? <SupabaseSetupCard /> : null}

      {isConfigured && status === 'loading' ? (
        <LoadingState message="Cargando tu cuenta…" />
      ) : null}

      {isConfigured && status === 'unauthenticated' ? (
        <ProfileHero
          onSignIn={() => router.push('/auth')}
          onSignUp={() => router.push({ pathname: '/auth', params: { mode: 'signUp' } })}
        />
      ) : null}

      {isConfigured && status === 'authenticated' && user ? (
        <View style={styles.content}>
          <View
            style={[
              styles.actionsCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={styles.actionsHeader}>
              <ThemedText type="smallBold">Perfil activo</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Cada perfil tiene su nombre, avatar y equipo favorito.
              </ThemedText>
            </View>
            <View style={styles.activeProfileRow}>
              {activeProfile.profile ? (
                <AccountProfileAvatar
                  avatarId={activeProfile.profile.avatarId}
                  color={activeProfile.profile.avatarColor}
                  size={56}
                />
              ) : null}
              <View style={styles.activeProfileText}>
                <ThemedText type="smallBold">
                  {activeProfile.profile?.name ?? 'Elige un perfil'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {activeProfile.profile?.favoriteTeamName ?? 'Sin equipo asignado'}
                </ThemedText>
              </View>
            </View>
            <Button
              label="Cambiar de perfil"
              variant="secondary"
              onPress={() => router.push('/select-profile')}
            />
          </View>

          <ProfileSummary user={user} profile={profile} />
          <PointsSummary
            summary={predictionsQuery.summary}
            rank={myRank}
            loading={predictionsQuery.isPending || rankingQuery.isPending}
          />

          {profileError ? (
            <ErrorState
              title="No se pudo cargar tu perfil"
              message={profileError}
              onRetry={() => void refreshProfile()}
            />
          ) : null}

          <FavoriteTeamCard
            team={findTeamOption(activeProfile.profile?.favoriteTeamId ?? null)}
            teamName={activeProfile.profile?.favoriteTeamName}
            teamLogo={activeProfile.profile?.favoriteTeamLogo}
            description={
              activeProfile.profile
                ? `Solo del perfil ${activeProfile.profile.name}.`
                : 'Elige un perfil para asignarle un equipo.'
            }
            onPress={() =>
              router.push({
                pathname: '/select-profile',
                params: { edit: activeProfile.profile?.id ?? 'active' },
              })
            }
          />

          <NotificationsCard />

          <View
            style={[
              styles.actionsCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={styles.actionsHeader}>
              <ThemedText type="smallBold">Cuenta</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Gestiona tus datos y tu sesión.
              </ThemedText>
            </View>
            <Button
              label="Editar perfil"
              variant="secondary"
              onPress={() => router.push('/edit-profile')}
            />
            {actionError ? (
              <ThemedText type="small" style={{ color: theme.live }}>
                {actionError}
              </ThemedText>
            ) : null}
            <Button label="Cerrar sesión" variant="ghost" onPress={() => void handleSignOut()} />
            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
            <ThemedText type="small" themeColor="textSecondary">
              Eliminar tu cuenta borra tu perfil, tus pronósticos y tus ligas. No se puede deshacer.
            </ThemedText>
            <Button
              label="Eliminar cuenta"
              variant="danger"
              onPress={() => router.push('/delete-account')}
            />
          </View>

          <View
            style={[
              styles.actionsCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={styles.actionsHeader}>
              <ThemedText type="smallBold">Legal</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Privacidad, condiciones de uso y fuentes de datos.
              </ThemedText>
            </View>
            <LegalLinks />
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            AFFutbol guarda tu cuenta, tus pronósticos y tus ligas con Supabase. Consulta tu
            posición en la pestaña Ranking.
          </ThemedText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  actionsCard: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  actionsHeader: {
    gap: Spacing.half,
    paddingBottom: Spacing.one,
  },
  activeProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  activeProfileText: {
    flex: 1,
    gap: Spacing.half,
  },
  cardDivider: {
    height: 1,
  },
  footer: {
    textAlign: 'center',
  },
});
