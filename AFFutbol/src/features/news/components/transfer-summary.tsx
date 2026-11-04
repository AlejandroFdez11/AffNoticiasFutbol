import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { FeedRumor, RumorClub } from '../types';

/**
 * Clubs and fee are derived from the headline by the `news-refresh` function,
 * so any of them can be missing. We render what we know and nothing else: no
 * invented percentages or player ages.
 */
export function TransferSummary({ rumor }: { rumor: FeedRumor }) {
  const theme = useTheme();

  if (!rumor.from && !rumor.to && !rumor.fee) {
    return null;
  }

  return (
    <View style={styles.container}>
      {rumor.from && rumor.to ? (
        <View style={styles.clubs}>
          <ClubColumn club={rumor.from} label="De" />
          <SymbolView
            name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
            size={16}
            tintColor={theme.textSecondary}
          />
          <ClubColumn club={rumor.to} label="A" align="right" />
        </View>
      ) : rumor.to ? (
        <ClubColumn club={rumor.to} label="Destino" />
      ) : rumor.from ? (
        <ClubColumn club={rumor.from} label="Origen" />
      ) : null}

      {rumor.fee ? (
        <View style={styles.figures}>
          <ThemedText type="small" themeColor="textSecondary">
            Coste estimado
          </ThemedText>
          <ThemedText type="smallBold">{rumor.fee}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function ClubColumn({
  club,
  label,
  align = 'left',
}: {
  club: RumorClub;
  label: string;
  align?: 'left' | 'right';
}) {
  const right = align === 'right';

  return (
    <View style={[styles.club, right && styles.clubRight]}>
      <TeamBadge name={club.name} logo={club.logo} size={26} />
      <View style={[styles.clubText, right && styles.clubTextRight]}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={1}>
          {club.name}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  clubs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  club: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clubRight: {
    flexDirection: 'row-reverse',
  },
  clubText: {
    flex: 1,
    gap: 1,
  },
  clubTextRight: {
    alignItems: 'flex-end',
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
