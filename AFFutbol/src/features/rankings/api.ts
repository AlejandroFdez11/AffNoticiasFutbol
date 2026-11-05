import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';
import { requireSupabase } from '@/features/auth/supabase';

import {
  mapLeague,
  mapRankingEntry,
  type League,
  type LeagueRow,
  type RankingEntry,
  type RankingRow,
} from './types';

const RANKINGS_STALE_TIME_MS = 60_000;

export const leagueKeys = {
  all: ['leagues'] as const,
  mine: (userId: string) => [...leagueKeys.all, 'mine', userId] as const,
};

export const rankingKeys = {
  all: ['rankings'] as const,
  global: (userId: string) => [...rankingKeys.all, 'global', userId] as const,
  league: (userId: string, leagueId: string) =>
    [...rankingKeys.all, 'league', userId, leagueId] as const,
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
export function describeRankingError(error: unknown): string {
  const { code, message } = readError(error);
  const normalized = message?.toLowerCase() ?? '';

  switch (code) {
    case '42P01':
    case 'PGRST205':
      return 'Faltan las tablas de ligas. Ejecuta la migración de Supabase.';
    case 'PGRST202':
    case '42883':
      return 'Faltan las funciones del ranking. Ejecuta la migración de Supabase.';
    case '22023':
    case '42501':
    case 'P0002':
      // The database already returns Spanish, user-facing messages.
      return message ?? 'No se pudo completar la operación.';
    default:
      break;
  }

  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  return message || 'No se pudo completar la operación. Inténtalo de nuevo.';
}

function readLeagueRef(data: unknown): { id: string } {
  const value = Array.isArray(data) ? data[0] : data;

  if (!value || typeof value !== 'object' || !('id' in value)) {
    throw new Error('La liga se creó, pero el servidor no devolvió sus datos.');
  }

  return { id: String((value as { id: unknown }).id) };
}

async function fetchGlobalRanking(limit: number): Promise<RankingEntry[]> {
  const client = requireSupabase();

  const { data, error } = await client.rpc('global_ranking', { p_limit: limit });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RankingRow[]).map(mapRankingEntry);
}

async function fetchMyLeagues(): Promise<League[]> {
  const client = requireSupabase();

  const { data, error } = await client.rpc('my_leagues');

  if (error) {
    throw error;
  }

  return ((data ?? []) as LeagueRow[]).map(mapLeague);
}

async function fetchLeagueRanking(leagueId: string): Promise<RankingEntry[]> {
  const client = requireSupabase();

  const { data, error } = await client.rpc('league_ranking', { p_league_id: leagueId });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RankingRow[]).map(mapRankingEntry);
}

async function createLeague(name: string): Promise<{ id: string }> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('create_league', { p_name: name });

  if (error) {
    throw error;
  }

  return readLeagueRef(data);
}

async function joinLeague(code: string): Promise<{ id: string }> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('join_league', { p_code: code });

  if (error) {
    throw error;
  }

  return readLeagueRef(data);
}

async function leaveLeague(leagueId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('leave_league', { p_league_id: leagueId });

  if (error) {
    throw error;
  }
}

export function useGlobalRanking(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: rankingKeys.global(user?.id ?? 'anonymous'),
    queryFn: () => fetchGlobalRanking(limit),
    enabled: Boolean(user),
    staleTime: RANKINGS_STALE_TIME_MS,
  });
}

export function useMyLeagues() {
  const { user } = useAuth();

  return useQuery({
    queryKey: leagueKeys.mine(user?.id ?? 'anonymous'),
    queryFn: () => fetchMyLeagues(),
    enabled: Boolean(user),
    staleTime: RANKINGS_STALE_TIME_MS,
  });
}

export function useLeagueRanking(leagueId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: rankingKeys.league(user?.id ?? 'anonymous', leagueId ?? 'none'),
    queryFn: () => fetchLeagueRanking(leagueId!),
    enabled: Boolean(user) && Boolean(leagueId),
    staleTime: RANKINGS_STALE_TIME_MS,
  });
}

function useLeagueMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>
) {
  const client = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: TInput) => {
      if (!user) {
        throw new Error('Inicia sesión para competir en una liga.');
      }

      return mutationFn(input);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: leagueKeys.all }),
        client.invalidateQueries({ queryKey: rankingKeys.all }),
      ]);
    },
  });
}

export function useCreateLeague() {
  return useLeagueMutation(createLeague);
}

export function useJoinLeague() {
  return useLeagueMutation(joinLeague);
}

export function useLeaveLeague() {
  return useLeagueMutation(async (leagueId: string) => {
    await leaveLeague(leagueId);
  });
}
