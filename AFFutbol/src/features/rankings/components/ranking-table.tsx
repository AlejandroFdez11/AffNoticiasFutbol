import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { RankingEntry } from '../types';

type RankingTableProps = {
  entries: readonly RankingEntry[];
};

export function RankingTable({ entries }: RankingTableProps) {
  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <RankingRow key={entry.userId} entry={entry} />
      ))}
    </View>
  );
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  const theme = useTheme();
  const podium = entry.rank <= 3;
  const detail = entry.favoriteTeamName ?? (entry.username ? `@${entry.username}` : 'Aficionado');

  return (
    <View
      accessibilityLabel={`Puesto ${entry.rank}, ${entry.displayName}, ${entry.totalPoints} puntos`}
      style={[
        styles.row,
        {
          backgroundColor: entry.isMe ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: entry.isMe ? theme.brand : theme.border,
        },
      ]}>
      <View
        style={[
          styles.rank,
          {
            backgroundColor: podium ? theme.brandMuted : 'transparent',
            borderColor: podium ? theme.brandMuted : theme.border,
          },
        ]}>
        <ThemedText
          type="smallBold"
          style={{ color: podium ? theme.brand : theme.textSecondary }}>
          {entry.rank}
        </ThemedText>
      </View>

      <Avatar name={entry.displayName} uri={entry.avatarUrl} size={40} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
            {entry.displayName}
          </ThemedText>
          {entry.isMe ? (
            <View style={[styles.meBadge, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="small" style={{ color: theme.brand }}>
                Tú
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>

      <View style={styles.points}>
        <ThemedText type="smallBold" style={{ color: theme.brand }}>
          {entry.totalPoints}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.exactScores === 1 ? '1 exacto' : `${entry.exactScores} exactos`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  rank: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    flexShrink: 1,
  },
  meBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  points: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
