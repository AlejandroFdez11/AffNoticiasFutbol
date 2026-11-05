import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { describeRankingError, useGlobalRanking } from '../api';
import type { RankingEntry } from '../types';
import { RankingTable } from './ranking-table';

export function GlobalRankingSection() {
  const theme = useTheme();
  const router = useRouter();
  const query = useGlobalRanking();
  const entries = query.data ?? [];
  const me = entries.find((entry) => entry.isMe) ?? null;

  if (query.isPending) {
    return <LoadingState message="Calculando el ranking mundial…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="No se pudo cargar el ranking"
        message={describeRankingError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <>
      {me ? <MyPositionCard entry={me} /> : null}

      {entries.length === 0 ? (
        <EmptyState
          icon={{ ios: 'trophy', android: 'emoji_events', web: 'emoji_events' }}
          title="Todavía no hay participantes"
          description="Cuando se resuelva el primer pronóstico, la clasificación aparecerá aquí."
        />
      ) : (
        <RankingTable entries={entries} />
      )}

      {!me ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Aún no entras en el ranking</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            El ranking mundial suma los puntos de tus pronósticos. Acierta un marcador para
            aparecer en la tabla.
          </ThemedText>
          <Button label="Ir a predicciones" onPress={() => router.push('/predictions')} />
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
        Solo aparecen los usuarios con al menos un pronóstico. Los puntos se actualizan al terminar
        cada partido.
      </ThemedText>
    </>
  );
}

function MyPositionCard({ entry }: { entry: RankingEntry }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        styles.positionCard,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.positionText}>
        <ThemedText type="small" themeColor="textSecondary">
          Tu posición mundial
        </ThemedText>
        <ThemedText type="subtitle" style={{ color: theme.brand }}>
          #{entry.rank}
        </ThemedText>
      </View>
      <View style={styles.positionText}>
        <ThemedText type="smallBold">{entry.totalPoints} pts</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.settled === 1 ? '1 resuelto' : `${entry.settled} resueltos`}
        </ThemedText>
      </View>
      <View style={styles.positionText}>
        <ThemedText type="smallBold">{entry.exactScores}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.exactScores === 1 ? 'exacto' : 'exactos'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  positionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionText: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  footer: {
    textAlign: 'center',
  },
});
