import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/state-card';
import { SupabaseSetupCard } from '@/components/supabase-setup-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/features/auth/auth-context';
import {
  ACCOUNT_PROFILE_LIMIT,
  canCreateAccountProfile,
  describeAccountProfileError,
  type AccountProfile,
  type AccountProfileInput,
} from '@/features/profile/account-profiles';
import {
  createAccountProfile,
  deleteAccountProfile,
  updateAccountProfile,
} from '@/features/profile/account-profiles-api';
import { AccountProfileAvatar } from '@/features/profile/components/account-profile-avatar';
import { AccountProfileEditor } from '@/features/profile/components/account-profile-editor';
import {
  accountProfilesKey,
  chooseActiveProfile,
  forgetActiveProfile,
  useActiveProfileId,
  useAccountProfiles,
} from '@/features/profile/use-account-profiles';

export default function SelectProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const queryClient = useQueryClient();
  const { status, isConfigured, user, updateProfile } = useAuth();
  const profilesQuery = useAccountProfiles();
  const activeIdQuery = useActiveProfileId();

  const profiles = useMemo(() => profilesQuery.data ?? [], [profilesQuery.data]);
  const activeId = activeIdQuery.data ?? null;
  const canAdd = canCreateAccountProfile(profiles.length);

  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState<AccountProfile | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `edit=active` opens the card for the current profile; a profile id opens
  // that one directly. Both are used by the Perfil tab to change its team.
  // Derived during render so no effect has to synchronise state with the route.
  const editRequest = typeof params.edit === 'string' && params.edit ? params.edit : null;
  const editTargetId = editRequest === 'active' ? activeId : editRequest;
  const paramEditor = editTargetId
    ? profiles.find((profile) => profile.id === editTargetId)
    : undefined;
  const currentEditor = editing !== undefined ? editing : paramEditor;

  const consumeEditParam = () => {
    if (editRequest) {
      router.setParams({ edit: '' });
    }
  };

  // Rankings and push reminders still read the account row. Keep that mirror
  // pointing at the active visual profile without touching the other profiles.
  const mirrorTeamToAccount = async (profile: AccountProfile) => {
    await updateProfile({
      favoriteTeamId: profile.favoriteTeamId,
      favoriteTeamName: profile.favoriteTeamName,
      favoriteTeamLogo: profile.favoriteTeamLogo,
    });
  };

  const refresh = () => {
    if (user) {
      void queryClient.invalidateQueries({ queryKey: accountProfilesKey(user.id) });
    }
  };

  const selectProfile = async (profile: AccountProfile) => {
    if (!user) {
      return;
    }

    setError(null);

    try {
      await chooseActiveProfile(queryClient, user.id, profile.id);
      await mirrorTeamToAccount(profile);
      router.replace('/');
    } catch (selectError) {
      setError(describeAccountProfileError(selectError));
    }
  };

  const saveProfile = async (input: AccountProfileInput) => {
    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = currentEditor
        ? await updateAccountProfile(currentEditor.id, input)
        : await createAccountProfile(input);

      if (currentEditor?.id === activeId) {
        await mirrorTeamToAccount(saved);
      }

      setEditing(undefined);
      consumeEditParam();
      setManaging(false);
      refresh();
    } catch (saveError) {
      setError(describeAccountProfileError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const removeProfile = async (profile: AccountProfile) => {
    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteAccountProfile(profile.id);

      if (activeId === profile.id) {
        await forgetActiveProfile(queryClient, user.id);
      }

      setEditing(undefined);
      consumeEditParam();
      refresh();
    } catch (deleteError) {
      setError(describeAccountProfileError(deleteError));
    } finally {
      setSaving(false);
    }
  };

  const showAuth = isConfigured && status === 'unauthenticated';

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <BrandMark size={36} />
          <ThemedText type="smallBold">AFFutbol</ThemedText>
        </View>
        <Button
          label="Explorar"
          variant="ghost"
          onPress={() => router.replace('/')}
          accessibilityLabel="Explorar sin elegir perfil"
        />
      </View>

      <ScreenHeader
        eyebrow="Tu cuenta"
        title={showAuth ? 'Bienvenido' : '¿Quién está viendo?'}
        subtitle={
          showAuth
            ? 'Entra para crear hasta tres perfiles y guardar tus pronósticos.'
            : 'Elige un perfil para continuar. Cada cuenta puede tener hasta tres.'
        }
      />

      {!isConfigured ? <SupabaseSetupCard /> : null}

      {isConfigured && status === 'loading' ? <LoadingState message="Cargando tus perfiles…" /> : null}

      {showAuth ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Tu sitio empieza aquí</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Inicia sesión o crea una cuenta para tener tus perfiles, puntos y ligas. También puedes
            explorar las noticias y los partidos sin cuenta.
          </ThemedText>
          <Button label="Iniciar sesión" onPress={() => router.push('/auth')} />
          <Button
            label="Crear cuenta"
            variant="secondary"
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signUp' } })}
          />
        </View>
      ) : null}

      {isConfigured && status === 'authenticated' && user ? (
        <>
          {profilesQuery.isPending ? <LoadingState message="Cargando tus perfiles…" /> : null}

          {profilesQuery.isError ? (
            <ErrorState
              title="No se pudieron cargar tus perfiles"
              message="Comprueba tu conexión e inténtalo de nuevo."
              onRetry={() => void profilesQuery.refetch()}
            />
          ) : null}

          {currentEditor !== undefined ? (
            <AccountProfileEditor
              key={currentEditor?.id ?? 'new'}
              profile={currentEditor}
              otherNames={profiles
                .filter((profile) => profile.id !== currentEditor?.id)
                .map((profile) => profile.name)}
              saving={saving}
              error={error}
              onSave={(input) => void saveProfile(input)}
              onCancel={() => {
                setError(null);
                setEditing(undefined);
                consumeEditParam();
              }}
            />
          ) : (
            <>
              <View style={styles.manageRow}>
                <Button
                  label={managing ? 'Listo' : 'Gestionar perfiles'}
                  variant="ghost"
                  onPress={() => {
                    setManaging((current) => !current);
                    setError(null);
                  }}
                />
              </View>

              <View style={styles.grid}>
                {profiles.map((profile) => (
                  <View key={profile.id} style={styles.tile}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={managing ? `Editar ${profile.name}` : `Entrar como ${profile.name}`}
                      onPress={() =>
                        managing ? setEditing(profile) : void selectProfile(profile)
                      }
                      style={({ pressed }) => [styles.tilePressable, pressed && styles.pressed]}>
                      <AccountProfileAvatar
                        avatarId={profile.avatarId}
                        color={profile.avatarColor}
                        active={profile.id === activeId}
                      />
                      <ThemedText type="smallBold">{profile.name}</ThemedText>
                      {profile.id === activeId ? (
                        <ThemedText type="small" themeColor="brand">
                          En uso
                        </ThemedText>
                      ) : null}
                    </Pressable>

                    {managing ? (
                      <View style={styles.tileActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Editar ${profile.name}`}
                          onPress={() => setEditing(profile)}
                          style={styles.tileAction}>
                          <SymbolView
                            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                            size={20}
                            tintColor={theme.textSecondary}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Borrar ${profile.name}`}
                          disabled={saving}
                          onPress={() => void removeProfile(profile)}
                          style={styles.tileAction}>
                          <SymbolView
                            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                            size={20}
                            tintColor={theme.live}
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ))}

                {canAdd ? (
                  <View style={styles.tile}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Añadir perfil"
                      onPress={() => setEditing(null)}
                      style={({ pressed }) => [
                        styles.tilePressable,
                        styles.addTile,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <View
                        style={[
                          styles.addIcon,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                        ]}>
                        <SymbolView
                          name={{ ios: 'plus', android: 'add', web: 'add' }}
                          size={36}
                          tintColor={theme.textSecondary}
                        />
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        Añadir perfil
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {!canAdd ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.limit}>
                  Has llegado al límite de {ACCOUNT_PROFILE_LIMIT} perfiles. Borra uno para crear otro.
                </ThemedText>
              ) : null}

              {error ? (
                <ThemedText type="small" style={{ color: theme.live }}>
                  {error}
                </ThemedText>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  manageRow: {
    alignItems: 'flex-end',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  tile: {
    flexBasis: '45%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  tilePressable: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  tileActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tileAction: {
    padding: Spacing.two,
  },
  addTile: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radii.large,
    padding: Spacing.two,
  },
  addIcon: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  limit: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
