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
import { usePredictionSummary } from '@/features/predictions/api';
import { FavoriteTeamCard } from '@/features/profile/components/favorite-team-card';
import { PointsSummary } from '@/features/profile/components/points-summary';
import { ProfileHero } from '@/features/profile/components/profile-hero';
import { ProfileSummary } from '@/features/profile/components/profile-summary';
import { getProfileDisplayName } from '@/features/profile/format';
import { findTeamOption } from '@/features/profile/teams';

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
          <ProfileSummary user={user} profile={profile} />
          <PointsSummary
            summary={predictionsQuery.summary}
            loading={predictionsQuery.isPending}
          />

          {profileError ? (
            <ErrorState
              title="No se pudo cargar tu perfil"
              message={profileError}
              onRetry={() => void refreshProfile()}
            />
          ) : null}

          <FavoriteTeamCard
            team={findTeamOption(profile?.favoriteTeamId ?? null)}
            teamName={profile?.favoriteTeamName}
            teamLogo={profile?.favoriteTeamLogo}
            onPress={() => router.push('/edit-profile')}
          />

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
            <Button label="Cerrar sesión" variant="danger" onPress={() => void handleSignOut()} />
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            AFFutbol guarda tu cuenta y tus pronósticos con Supabase. El ranking mundial llegará en
            la Fase 5.
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
  footer: {
    textAlign: 'center',
  },
});
