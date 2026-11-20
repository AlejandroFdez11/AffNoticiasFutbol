import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TeamBadge } from '@/components/team-badge';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  filterTeams,
  findTeamOption,
  getTeamLogoUrl,
  groupTeamsByLeague,
  type TeamOption,
} from '../teams';

type TeamPickerProps = {
  selectedTeamId: number | null;
  onSelect: (team: TeamOption | null) => void;
  label?: string;
};

type Section = {
  title: string;
  country: string;
  data: TeamOption[];
};

export function TeamPicker({
  selectedTeamId,
  onSelect,
  label = 'Equipo favorito',
}: TeamPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = findTeamOption(selectedTeamId);
  const sections = useMemo<Section[]>(() => {
    return groupTeamsByLeague(filterTeams(query)).map((group) => ({
      title: group.league,
      country: group.country,
      data: group.teams,
    }));
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (team: TeamOption | null) => {
    onSelect(team);
    close();
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selected ? `Equipo favorito: ${selected.name}. Cambiar` : 'Elegir equipo favorito'
        }
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        {selected ? (
          <TeamBadge name={selected.name} logo={getTeamLogoUrl(selected.id)} size={32} />
        ) : (
          <View style={[styles.triggerIcon, { backgroundColor: theme.brandMuted }]}>
            <SymbolView
              name={{ ios: 'sportscourt', android: 'sports_soccer', web: 'sports_soccer' }}
              size={20}
              tintColor={theme.brand}
            />
          </View>
        )}
        <ThemedText type="smallBold" style={styles.triggerText} numberOfLines={1}>
          {selected?.name ?? 'Elige un equipo'}
        </ThemedText>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={20}
          tintColor={theme.textSecondary}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={close}
        presentationStyle="pageSheet">
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitle}>
              <ThemedText type="smallBold">Equipo favorito</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Agrupado por liga
              </ThemedText>
            </View>
            <Button label="Listo" variant="ghost" onPress={close} />
          </View>

          <View style={styles.search}>
            <TextField
              label="Buscar equipo"
              value={query}
              onChangeText={setQuery}
              placeholder="Nombre, liga o país"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTeamId === null }}
            onPress={() => choose(null)}
            style={({ pressed }) => [
              styles.clearRow,
              {
                backgroundColor:
                  selectedTeamId === null ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: selectedTeamId === null ? theme.brand : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Sin equipo</ThemedText>
            {selectedTeamId === null ? (
              <SymbolView
                name={{
                  ios: 'checkmark.circle.fill',
                  android: 'check_circle',
                  web: 'check_circle',
                }}
                size={22}
                tintColor={theme.brand}
              />
            ) : null}
          </Pressable>

          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" themeColor="brand">
                  {section.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {section.country}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => {
              const selectedItem = item.id === selectedTeamId;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedItem }}
                  onPress={() => choose(item)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: selectedItem
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                      borderColor: selectedItem ? theme.brand : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <TeamBadge name={item.name} logo={getTeamLogoUrl(item.id)} size={36} />
                  <View style={styles.rowText}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {item.league} · {item.country}
                    </ThemedText>
                  </View>
                  {selectedItem ? (
                    <SymbolView
                      name={{
                        ios: 'checkmark.circle.fill',
                        android: 'check_circle',
                        web: 'check_circle',
                      }}
                      size={22}
                      tintColor={theme.brand}
                    />
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No hay equipos que coincidan con «{query}».
              </ThemedText>
            }
            contentContainerStyle={styles.list}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  triggerIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sheetTitle: {
    gap: Spacing.half,
  },
  search: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    marginBottom: Spacing.one,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  rowText: {
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
