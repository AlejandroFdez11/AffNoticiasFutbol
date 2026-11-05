import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { LoadingState } from '@/components/state-card';
import { SupabaseSetupCard } from '@/components/supabase-setup-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/features/auth/auth-context';
import { leagueKeys, rankingKeys } from '@/features/rankings/api';
import { GlobalRankingSection } from '@/features/rankings/components/global-ranking-section';
import { PrivateRankingSection } from '@/features/rankings/components/private-ranking-section';

type RankingScope = 'global' | 'private';

const SCOPES = [
  { key: 'global' as const, label: 'Mundial' },
  { key: 'private' as const, label: 'Mis ligas' },
];

export default function RankingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, isConfigured } = useAuth();
  const [scope, setScope] = useState<RankingScope>('global');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rankingKeys.all }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Ranking"
        subtitle="Compite en el ranking mundial o crea una liga privada con los tuyos."
        right={
          status === 'authenticated' ? (
            <IconButton
              icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              label="Actualizar ranking"
              busy={refreshing}
              onPress={() => void handleRefresh()}
            />
          ) : undefined
        }
      />

      {!isConfigured ? <SupabaseSetupCard /> : null}

      {isConfigured && status === 'loading' ? (
        <LoadingState message="Cargando tu cuenta…" />
      ) : null}

      {isConfigured && status === 'unauthenticated' ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Entra para competir</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            El ranking mundial y las ligas privadas usan los puntos de tus pronósticos. Partidos,
            noticias y estadísticas siguen abiertos sin cuenta.
          </ThemedText>
          <Button label="Iniciar sesión" onPress={() => router.push('/auth')} />
          <Button
            label="Crear cuenta"
            variant="secondary"
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signUp' } })}
          />
        </View>
      ) : null}

      {isConfigured && status === 'authenticated' ? (
        <>
          <SegmentedControl options={SCOPES} value={scope} onChange={setScope} />

          {scope === 'global' ? <GlobalRankingSection /> : <PrivateRankingSection />}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
});
