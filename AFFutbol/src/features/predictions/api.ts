import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';
import { requireSupabase } from '@/features/auth/supabase';
import { matchKeys } from '@/features/matches/api';
import { filterFixturesByLeague } from '@/features/matches/league-filter';
import { getFixturesByDate } from '@/services/api-football/fixtures';

import {
  PREDICTION_FIXTURES_STALE_TIME_MS,
  PREDICTIONS_STALE_TIME_MS,
} from './constants';
import { getPredictableFixtures, isPredictionOpen, predictionWindowDateKeys } from './fixtures';
import { summarizePredictions } from './scoring';
import {
  mapPrediction,
  type Prediction,
  type PredictionInput,
  type PredictionRow,
} from './types';

export const predictionKeys = {
  all: ['predictions'] as const,
  list: (userId: string) => [...predictionKeys.all, 'list', userId] as const,
};

type ErrorWithCode = { code?: string; message?: string };

function readError(error: unknown): ErrorWithCode {
  if (typeof error === 'object' && error !== null) {
    const value = error as ErrorWithCode;
    return {
      code: typeof value.code === 'string' ? value.code : undefined,
      message: typeof value.message === 'string' ? value.message : undefined,
    };
  }

  return { message: typeof error === 'string' ? error : undefined };
}

/** Maps Postgres/PostgREST errors to copy the user can act on. */
export function describePredictionsError(error: unknown): string {
  if (error instanceof Error && error.message && !('code' in error)) {
    return error.message;
  }

  const { code, message } = readError(error);
  const normalized = message?.toLowerCase() ?? '';

  switch (code) {
    case '42P01':
    case 'PGRST205':
      return 'Falta la tabla de predicciones. Ejecuta la migración de Supabase.';
    case '42501':
      return 'No tienes permiso para guardar este pronóstico.';
    case '23514':
      return 'El marcador debe estar entre 0 y 20 goles.';
    case '23505':
      return 'Ya tienes un pronóstico para este partido.';
    default:
      break;
  }

  if (normalized.includes('row-level security')) {
    return 'El partido ya ha comenzado: los pronósticos se cierran al inicio.';
  }

  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  return message || 'No se pudo guardar tu pronóstico. Inténtalo de nuevo.';
}

async function fetchPredictions(userId: string): Promise<Prediction[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('kickoff_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PredictionRow[]).map(mapPrediction);
}

/**
 * Creates or updates the prediction of a fixture. The database decides whether
 * it is still open, and it is the only writer of `status` and `points`.
 */
async function savePrediction(userId: string, input: PredictionInput): Promise<Prediction> {
  const client = requireSupabase();

  const { data: existing, error: readError } = await client
    .from('predictions')
    .select('id, kickoff_at')
    .eq('user_id', userId)
    .eq('fixture_id', input.fixtureId)
    .maybeSingle<{ id: string; kickoff_at: string }>();

  if (readError) {
    throw readError;
  }

  if (existing) {
    if (!isPredictionOpen(existing.kickoff_at)) {
      throw new Error('El partido ya ha comenzado. Los pronósticos se cierran al inicio.');
    }

    const { data, error } = await client
      .from('predictions')
      .update({ home_goals: input.homeGoals, away_goals: input.awayGoals })
      .eq('id', existing.id)
      .select('*')
      .single<PredictionRow>();

    if (error) {
      throw error;
    }

    return mapPrediction(data);
  }

  const { data, error } = await client
    .from('predictions')
    .insert({
      fixture_id: input.fixtureId,
      league_id: input.leagueId,
      home_team_id: input.homeTeamId,
      home_team_name: input.homeTeamName,
      away_team_id: input.awayTeamId,
      away_team_name: input.awayTeamName,
      kickoff_at: input.kickoffAt,
      home_goals: input.homeGoals,
      away_goals: input.awayGoals,
    })
    .select('*')
    .single<PredictionRow>();

  if (error) {
    throw error;
  }

  return mapPrediction(data);
}

export function usePredictions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: predictionKeys.list(user?.id ?? 'anonymous'),
    queryFn: () => fetchPredictions(user!.id),
    enabled: Boolean(user),
    staleTime: PREDICTIONS_STALE_TIME_MS,
  });
}

/** Points, hits and pending count of the signed-in user. */
export function usePredictionSummary() {
  const query = usePredictions();
  const summary = summarizePredictions(query.data ?? []);

  return { ...query, summary };
}

export function useSavePrediction() {
  const client = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: PredictionInput) => {
      if (!user) {
        throw new Error('Inicia sesión para guardar tu pronóstico.');
      }

      return savePrediction(user.id, input);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: predictionKeys.all });
    },
  });
}

/**
 * Matches of the favourite team that can still be predicted. Reuses the
 * matches cache (same query keys), so opening both tabs costs nothing extra.
 */
export function useUpcomingTeamFixtures(teamId: number | null) {
  const dateKeys = predictionWindowDateKeys();

  const results = useQueries({
    queries: dateKeys.map((dateKey) => ({
      queryKey: matchKeys.byDate(dateKey),
      queryFn: () => getFixturesByDate(dateKey),
      select: filterFixturesByLeague,
      staleTime: PREDICTION_FIXTURES_STALE_TIME_MS,
    })),
  });

  const fixtures = results.flatMap((result) => result.data ?? []);

  return {
    fixtures: getPredictableFixtures(fixtures, teamId),
    isPending: results.every((result) => result.isPending),
    isError: results.every((result) => result.isError),
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
}
