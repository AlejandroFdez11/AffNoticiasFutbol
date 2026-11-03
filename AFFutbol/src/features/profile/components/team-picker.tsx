import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { filterTeams, getTeamLogoUrl, type TeamOption } from '../teams';

type TeamPickerProps = {
  selectedTeamId: number | null;
  onSelect: (team: TeamOption) => void;
};

export function TeamPicker({ selectedTeamId, onSelect }: TeamPickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const teams = useMemo(() => filterTeams(query), [query]);

  return (
    <View style={styles.container}>
      <TextField
        label="Buscar equipo"
        value={query}
        onChangeText={setQuery}
        placeholder="Nombre, liga o país"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.list}>
        {teams.map((team) => {
          const selected = team.id === selectedTeamId;

          return (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(team)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: selected ? theme.brand : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <TeamBadge name={team.name} logo={getTeamLogoUrl(team.id)} size={36} />
              <View style={styles.text}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {team.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {team.league} · {team.country}
                </ThemedText>
              </View>
              {selected ? (
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  size={22}
                  tintColor={theme.brand}
                />
              ) : null}
            </Pressable>
          );
        })}

        {teams.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No hay equipos que coincidan con «{query}».
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
