import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  INVITE_CODE_LENGTH,
  LEAGUE_NAME_MAX_LENGTH,
  normalizeInviteCode,
  normalizeLeagueName,
  validateInviteCode,
  validateLeagueName,
} from '../validation';

type LeagueFormCardProps = {
  mode: 'create' | 'join';
  loading?: boolean;
  error?: string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onValueChange?: () => void;
};

export function LeagueFormCard({
  mode,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
  onValueChange,
}: LeagueFormCardProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isCreate = mode === 'create';

  const handleSubmit = () => {
    const normalized = isCreate ? normalizeLeagueName(value) : normalizeInviteCode(value);
    const nextError = isCreate ? validateLeagueName(normalized) : validateInviteCode(normalized);

    setValidationError(nextError);

    if (!nextError) {
      onSubmit(normalized);
    }
  };

  const displayError = validationError ?? error;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{isCreate ? 'Crear una liga' : 'Unirme a una liga'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isCreate
            ? 'Ponle nombre y comparte el código de invitación con quien quieras competir.'
            : `Pídele el código de ${INVITE_CODE_LENGTH} caracteres a quien creó la liga.`}
        </ThemedText>
      </View>

      <TextField
        label={isCreate ? 'Nombre de la liga' : 'Código de invitación'}
        value={value}
        onChangeText={(text) => {
          setValue(isCreate ? text : normalizeInviteCode(text));
          setValidationError(null);
          onValueChange?.();
        }}
        placeholder={isCreate ? 'Los del curro' : 'ABC123'}
        maxLength={isCreate ? LEAGUE_NAME_MAX_LENGTH : INVITE_CODE_LENGTH}
        autoCapitalize={isCreate ? 'sentences' : 'characters'}
        autoCorrect={false}
        error={displayError ?? undefined}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />

      <View style={styles.actions}>
        <Button
          label={isCreate ? 'Crear liga' : 'Unirme'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.action}
        />
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          style={styles.action}
        />
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
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
