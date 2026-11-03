import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { TeamOption } from '../teams';

type FavoriteTeamCardProps = {
  team: TeamOption | null;
  teamName?: string | null;
  teamLogo?: string | null;
  onPress: () => void;
};

export function FavoriteTeamCard({ team, teamName, teamLogo, onPress }: FavoriteTeamCardProps) {
  const theme = useTheme();
  const name = team?.name ?? teamName ?? null;
  const logo = team ? `https://media.api-sports.io/football/teams/${team.id}.png` : teamLogo;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Equipo favorito</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Personaliza tu experiencia
        </ThemedText>
      </View>

      {name ? (
        <View style={styles.teamRow}>
          <TeamBadge name={name} logo={logo ?? undefined} size={44} />
          <View style={styles.teamText}>
            <ThemedText type="smallBold">{name}</ThemedText>
            {team ? (
              <ThemedText type="small" themeColor="textSecondary">
                {team.league} · {team.country}
              </ThemedText>
            ) : null}
          </View>
          <Button label="Cambiar" variant="secondary" onPress={onPress} style={styles.action} />
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.icon, { backgroundColor: theme.brandMuted }]}>
            <SymbolView
              name={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
              size={26}
              tintColor={theme.brand}
            />
          </View>
          <View style={styles.emptyText}>
            <ThemedText type="smallBold">Aún no has elegido equipo</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Elige tu club para personalizar partidos, noticias y predicciones.
            </ThemedText>
          </View>
          <Button label="Elegir equipo" onPress={onPress} style={styles.action} />
        </View>
      )}
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
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  teamText: {
    flex: 1,
    gap: Spacing.half,
  },
  action: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  empty: {
    gap: Spacing.three,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    gap: Spacing.half,
  },
});
