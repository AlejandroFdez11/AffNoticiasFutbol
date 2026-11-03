import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { LoadingState } from '@/components/state-card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { describeAuthError, useAuth } from '@/features/auth/auth-context';
import { TeamPicker } from '@/features/profile/components/team-picker';
import { getProfileDisplayName } from '@/features/profile/format';
import { findTeamOption, getTeamLogoUrl, type TeamOption } from '@/features/profile/teams';
import { getProfileInitials } from '@/features/profile/types';
import {
  hasProfileFormErrors,
  normalizeUsername,
  validateProfileForm,
  type ProfileFormErrors,
} from '@/features/profile/validation';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, user, profile, profileError, updateProfile } = useAuth();

  const initialized = useRef(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialized.current || !user || (!profile && !profileError)) {
      return;
    }

    initialized.current = true;
    setDisplayName(profile?.displayName ?? getProfileDisplayName(profile, user));
    setUsername(profile?.username ?? '');
    setSelectedTeamId(profile?.favoriteTeamId ?? null);
  }, [profile, profileError, user]);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  const handleSelectTeam = (team: TeamOption) => {
    setSelectedTeamId((current) => (current === team.id ? null : team.id));
  };

  const handleSave = async () => {
    const nextErrors = validateProfileForm(displayName, username);
    setErrors(nextErrors);

    if (hasProfileFormErrors(nextErrors)) {
      return;
    }

    const team = findTeamOption(selectedTeamId);
    const keepsExistingTeam = selectedTeamId === (profile?.favoriteTeamId ?? null);

    setBusy(true);
    setError(null);

    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        username: normalizeUsername(username) || null,
        favoriteTeamId: selectedTeamId,
        favoriteTeamName: team?.name ?? (keepsExistingTeam ? profile?.favoriteTeamName ?? null : null),
        favoriteTeamLogo: team ? getTeamLogoUrl(team.id) : keepsExistingTeam ? profile?.favoriteTeamLogo ?? null : null,
      });
      close();
    } catch (saveError) {
      setError(describeAuthError(saveError));
    } finally {
      setBusy(false);
    }
  };

  if (status !== 'authenticated' || !user) {
    return (
      <Screen contentContainerStyle={styles.screen}>
        <View style={styles.topBar}>
          <View />
          <IconButton
            icon={{ ios: 'xmark', android: 'close', web: 'close' }}
            label="Cerrar"
            tone="textSecondary"
            onPress={close}
          />
        </View>
        <ScreenHeader eyebrow="Tu cuenta" title="Editar perfil" />
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Inicia sesión para editar tu perfil</ThemedText>
          <Button label="Iniciar sesión" onPress={() => router.replace('/auth')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View />
        <IconButton
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          label="Cerrar"
          tone="textSecondary"
          onPress={close}
        />
      </View>

      <ScreenHeader
        eyebrow="Tu cuenta"
        title="Editar perfil"
        subtitle="Así te verán tus amigos en los rankings."
      />

      {!profile && !profileError ? (
        <LoadingState message="Cargando tu perfil…" />
      ) : (
        <View style={styles.form}>
        <View
          style={[
            styles.identity,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Avatar
            name={getProfileInitials(profile, user.email ?? 'AF')}
            uri={profile?.avatarUrl}
            size={44}
          />
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.email}>
            {user.email}
          </ThemedText>
        </View>

        <TextField
          label="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="¿Cómo quieres que te llamemos?"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.displayName}
          maxLength={40}
        />

        <TextField
          label="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          placeholder="tu_apodo"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          error={errors.username}
          hint="Entre 3 y 20 caracteres: letras minúsculas, números, punto o guion bajo."
          maxLength={20}
        />

        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold">Equipo favorito</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Puedes cambiarlo cuando quieras.
          </ThemedText>
        </View>

        <TeamPicker selectedTeamId={selectedTeamId} onSelect={handleSelectTeam} />

        {profileError ? (
          <ThemedText type="small" style={{ color: theme.warning }}>
            {profileError}
          </ThemedText>
        ) : null}

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={{ color: theme.live }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <Button label="Guardar cambios" loading={busy} onPress={() => void handleSave()} />
        </View>
      )}
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
  form: {
    gap: Spacing.three,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  email: {
    flex: 1,
  },
  sectionHeader: {
    gap: Spacing.half,
    paddingTop: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Radii.medium,
  },
});
