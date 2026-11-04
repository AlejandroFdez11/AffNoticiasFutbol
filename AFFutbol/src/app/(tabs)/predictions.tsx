import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card';
import { SupabaseSetupCard } from '@/components/supabase-setup-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/features/auth/auth-context';
import {
  describePredictionsError,
  usePredictionSummary,
  useSavePrediction,
  useUpcomingTeamFixtures,
} from '@/features/predictions/api';
import { PredictionCard } from '@/features/predictions/components/prediction-card';
import { PredictionHistoryRow } from '@/features/predictions/components/prediction-history-row';
import { PredictionSummaryCard } from '@/features/predictions/components/prediction-summary';
import { ScoringRulesCard } from '@/features/predictions/components/scoring-rules-card';
import { isPredictionOpen } from '@/features/predictions/fixtures';
import type { PredictionInput } from '@/features/predictions/types';
import { findTeamOption } from '@/features/profile/teams';

export default function PredictionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, isConfigured, profile, profileError } = useAuth();

  const predictionsQuery = usePredictionSummary();
  const favouriteTeamId = profile?.favoriteTeamId ?? null;
  const upcomingQuery = useUpcomingTeamFixtures(favouriteTeamId);
  const saveMutation = useSavePrediction();
  const [actionError, setActionError] = useState<string | null>(null);

  const predictions = predictionsQuery.data ?? [];
  const predictionsByFixture = new Map(predictions.map((item) => [item.fixtureId, item]));
  const history = predictions.filter((item) => !isPredictionOpen(item.kickoffAt));

  const teamName =
    profile?.favoriteTeamName ?? findTeamOption(favouriteTeamId)?.name ?? null;

  const handleSave = (input: PredictionInput) => {
    setActionError(null);
    saveMutation.mutate(input, {
      onError: (error) => setActionError(describePredictionsError(error)),
    });
  };

  const handleRefresh = () => {
    void predictionsQuery.refetch();
    void upcomingQuery.refetch();
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="AFFutbol"
        title="Predicciones"
        subtitle={
          teamName
            ? `Pronostica los partidos de ${teamName}`
            : 'Pronostica el marcador y suma puntos por cada acierto.'
        }
        right={
          status === 'authenticated' ? (
            <IconButton
              icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              label="Actualizar predicciones"
              busy={predictionsQuery.isRefetching}
              onPress={handleRefresh}
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
            Guarda tus pronósticos, consulta tus puntos y compáralos con el resto de la afición.
            Partidos, noticias y estadísticas siguen abiertos sin cuenta.
          </ThemedText>
          <Button label="Iniciar sesión" onPress={() => router.push('/auth')} />
          <Button
            label="Crear cuenta"
            variant="secondary"
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signUp' } })}
          />
        </View>
      ) : null}

      {isConfigured && status === 'authenticated' && !profile && !profileError ? (
        <LoadingState message="Cargando tu perfil…" />
      ) : null}

      {isConfigured && status === 'authenticated' && !favouriteTeamId ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Elige tu equipo favorito</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Los pronósticos son de los partidos de tu equipo. Puedes cambiarlo cuando quieras desde
            tu perfil.
          </ThemedText>
          <Button label="Elegir equipo" onPress={() => router.push('/edit-profile')} />
        </View>
      ) : null}

      {isConfigured && status === 'authenticated' && favouriteTeamId ? (
        <>
          <PredictionSummaryCard
            summary={predictionsQuery.summary}
            loading={predictionsQuery.isPending}
          />

          <ScoringRulesCard />

          {predictionsQuery.isError ? (
            <ErrorState
              title="No se pudieron cargar tus pronósticos"
              message={describePredictionsError(predictionsQuery.error)}
              onRetry={() => void predictionsQuery.refetch()}
            />
          ) : null}

          {actionError ? (
            <ThemedText type="small" style={{ color: theme.live }}>
              {actionError}
            </ThemedText>
          ) : null}

          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold">Próximos partidos</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {teamName}
            </ThemedText>
          </View>

          {upcomingQuery.isPending ? (
            <LoadingState message="Buscando partidos…" />
          ) : upcomingQuery.isError ? (
            <ErrorState
              title="No se pudieron cargar los partidos"
              message="No se pudo consultar el calendario de tu equipo. Inténtalo de nuevo."
              onRetry={() => void upcomingQuery.refetch()}
            />
          ) : upcomingQuery.fixtures.length === 0 ? (
            <EmptyState
              icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              title="Sin partidos próximos"
              description={`No hay encuentros de ${teamName} en los próximos días. Vuelve a mirar cuando se acerque la jornada.`}
            />
          ) : (
            upcomingQuery.fixtures.map((fixture) => (
              <PredictionCard
                key={fixture.fixture.id}
                fixture={fixture}
                prediction={predictionsByFixture.get(fixture.fixture.id)}
                saving={
                  saveMutation.isPending &&
                  saveMutation.variables?.fixtureId === fixture.fixture.id
                }
                onSave={handleSave}
              />
            ))
          )}

          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold">Historial</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {history.length} {history.length === 1 ? 'pronóstico' : 'pronósticos'}
            </ThemedText>
          </View>

          {history.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aquí aparecerán tus pronósticos cerrados, con el resultado y los puntos que hayas
              sumado.
            </ThemedText>
          ) : (
            history.map((prediction) => (
              <PredictionHistoryRow key={prediction.id} prediction={prediction} />
            ))
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            Los pronósticos se cierran al inicio del partido. Los puntos los calcula el servidor
            cuando el partido termina.
          </ThemedText>
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
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  footer: {
    textAlign: 'center',
  },
});
