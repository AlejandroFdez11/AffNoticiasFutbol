import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  AVATAR_COLORS,
  DEFAULT_AVATAR_COLOR,
  hasAccountProfileFormErrors,
  validateAccountProfileInput,
  type AccountProfile,
  type AccountProfileInput,
} from '../account-profiles';
import { DEFAULT_AVATAR_ID, PROFILE_AVATARS } from '../avatars';
import { findTeamOption, getTeamLogoUrl } from '../teams';
import { AccountProfileAvatar } from './account-profile-avatar';
import { TeamPicker } from './team-picker';

type AccountProfileEditorProps = {
  profile: AccountProfile | null;
  otherNames: readonly string[];
  saving: boolean;
  error: string | null;
  onSave: (input: AccountProfileInput) => void;
  onCancel: () => void;
};

export function AccountProfileEditor({
  profile,
  otherNames,
  saving,
  error,
  onSave,
  onCancel,
}: AccountProfileEditorProps) {
  const theme = useTheme();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? DEFAULT_AVATAR_ID);
  const [color, setColor] = useState(profile?.avatarColor ?? DEFAULT_AVATAR_COLOR);
  const [teamId, setTeamId] = useState<number | null>(profile?.favoriteTeamId ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const team = findTeamOption(teamId);

  const handleSave = () => {
    const input: AccountProfileInput = {
      name,
      avatarId,
      avatarColor: color,
      favoriteTeamId: team?.id ?? null,
      favoriteTeamName: team?.name ?? null,
      favoriteTeamLogo: team ? getTeamLogoUrl(team.id) : null,
    };
    const errors = validateAccountProfileInput(input, otherNames);

    setValidationError(hasAccountProfileFormErrors(errors) ? (errors.name ?? null) : null);

    if (!hasAccountProfileFormErrors(errors)) {
      onSave(input);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ThemedText type="smallBold">
        {profile ? `Editar a ${profile.name}` : 'Nuevo perfil'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Elige cómo quieres que te reconozcan en la app.
      </ThemedText>

      <View style={styles.preview}>
        <AccountProfileAvatar avatarId={avatarId} color={color} size={72} />
        <ThemedText type="small" themeColor="textSecondary">
          Así se verá tu perfil.
        </ThemedText>
      </View>

      <TextField
        label="Nombre del perfil"
        value={name}
        onChangeText={setName}
        placeholder="Por ejemplo, Ale"
        maxLength={20}
        autoCapitalize="words"
        error={validationError ?? undefined}
      />

      <View style={styles.pickerGroup}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Imagen
        </ThemedText>
        <View style={styles.options}>
          {PROFILE_AVATARS.map((option) => {
            const selected = avatarId === option.id;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`Imagen ${option.label}`}
                accessibilityState={{ selected }}
                onPress={() => setAvatarId(option.id)}
                style={[
                  styles.avatarOption,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.background,
                    borderColor: selected ? theme.brand : theme.border,
                  },
                ]}>
                <SymbolView
                  name={option.symbol}
                  size={26}
                  tintColor={selected ? theme.brand : theme.textSecondary}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.pickerGroup}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Color
        </ThemedText>
        <View style={styles.options}>
          {AVATAR_COLORS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Color ${option}`}
              accessibilityState={{ selected: color === option }}
              onPress={() => setColor(option)}
              style={[
                styles.colorOption,
                { backgroundColor: theme[option], borderColor: color === option ? theme.text : 'transparent' },
              ]}>
              {color === option ? (
                <ThemedText themeColor="inverseText" type="smallBold">
                  ✓
                </ThemedText>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <TeamPicker
        label="Equipo favorito de este perfil"
        selectedTeamId={teamId}
        onSelect={(selected) => setTeamId(selected?.id ?? null)}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Este equipo es solo del perfil que estás editando.
      </ThemedText>

      {error ? (
        <ThemedText type="small" style={{ color: theme.live }}>
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onCancel} disabled={saving} />
        <Button label="Guardar" loading={saving} onPress={handleSave} />
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pickerGroup: {
    gap: Spacing.two,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  avatarOption: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  colorOption: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    borderWidth: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
