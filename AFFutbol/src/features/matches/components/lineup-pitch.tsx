import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getLineupPlayerKey, type LineupRow } from '../lineups';

/**
 * Starting eleven drawn on a pitch. API-Football numbers the goalkeeper line as
 * row 1, so the rows are reversed to keep the goal at the bottom and the attack
 * at the top. Rows are plain flex boxes: no absolute math, every line is
 * distributed evenly on its own.
 */
export function LineupPitch({ rows }: { rows: LineupRow[] }) {
  const theme = useTheme();
  const ordered = [...rows].reverse();

  return (
    <View
      testID="lineup-pitch"
      style={[styles.pitch, { backgroundColor: theme.pitch, borderColor: theme.pitchLine }]}>
      <View style={[styles.halfwayLine, { backgroundColor: theme.pitchLine }]} />
      <View style={[styles.centerCircle, { borderColor: theme.pitchLine }]} />

      {ordered.map((row) => (
        <View key={row.row} style={styles.row}>
          {row.players.map((player, index) => (
            <View key={getLineupPlayerKey(player, index)} style={styles.slot}>
              <View style={[styles.shirt, { backgroundColor: theme.pitchText }]}>
                <ThemedText type="smallBold" style={[styles.number, { color: theme.pitch }]}>
                  {player.number}
                </ThemedText>
              </View>
              <ThemedText
                type="small"
                themeColor="pitchText"
                numberOfLines={1}
                style={styles.name}>
                {player.name}
              </ThemedText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    position: 'relative',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  halfwayLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 72,
    height: 72,
    marginLeft: -36,
    marginTop: -36,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  shirt: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill
  },
  number: {
    fontSize: 11,
    lineHeight: 14,
  },
  name: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
