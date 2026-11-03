import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { FeedRumor, RumorClub } from '../types';

function probabilityColor(probability: number): 'brand' | 'accent' | 'textSecondary' {
  if (probability >= 70) return 'brand';
  if (probability >= 40) return 'accent';
  return 'textSecondary';
}

export function TransferSummary({ rumor }: { rumor: FeedRumor }) {
  const theme = useTheme();
  const tone = probabilityColor(rumor.probability);
  const color = theme[tone];

  return (
    <View style={styles.container}>
      <View style={styles.clubs}>
        <ClubColumn club={rumor.from} label="De" />
        <SymbolView
          name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
          size={16}
          tintColor={theme.textSecondary}
        />
        <ClubColumn club={rumor.to} label="A" align="right" />
      </View>

      <View style={styles.figures}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Coste estimado
          </ThemedText>
          <ThemedText type="smallBold">{rumor.fee}</ThemedText>
        </View>
        <View style={styles.probability}>
          <ThemedText type="small" themeColor="textSecondary">
            Probabilidad
          </ThemedText>
          <ThemedText type="smallBold" style={{ color }}>
            {rumor.probability}%
          </ThemedText>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, Math.max(0, rumor.probability))}%`, backgroundColor: color },
          ]}
        />
      </View>
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
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  probability: {
    alignItems: 'flex-end',
  },
  track: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
});
