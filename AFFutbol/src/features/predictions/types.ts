import type { Fixture } from '@/services/api-football/types';

export type PredictionStatus = 'pending' | 'settled' | 'void';

/** How a prediction compares with the final score. */
export type PredictionOutcome = 'exact' | 'partial' | 'miss' | 'pending' | 'void';

export type Prediction = {
  id: string;
  fixtureId: number;
  leagueId: number | null;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  kickoffAt: string;
  homeGoals: number;
  awayGoals: number;
  status: PredictionStatus;
  points: number | null;
  /** Only present once the settlement migration has run and the match ended. */
  finalHomeGoals: number | null;
  finalAwayGoals: number | null;
  settledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Row shape of `public.predictions` (snake_case). */
export type PredictionRow = {
  id: string;
  fixture_id: number;
  league_id: number | null;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  kickoff_at: string;
  home_goals: number;
  away_goals: number;
  status: string;
  points: number | null;
  final_home_goals?: number | null;
  final_away_goals?: number | null;
  settled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const STATUSES: readonly PredictionStatus[] = ['pending', 'settled', 'void'];

export function mapPrediction(row: PredictionRow): Prediction {
  const status = STATUSES.includes(row.status as PredictionStatus)
    ? (row.status as PredictionStatus)
    : 'pending';

  return {
    id: row.id,
    fixtureId: row.fixture_id,
    leagueId: row.league_id,
    homeTeamId: row.home_team_id,
    homeTeamName: row.home_team_name,
    awayTeamId: row.away_team_id,
    awayTeamName: row.away_team_name,
    kickoffAt: row.kickoff_at,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    status,
    points: row.points,
    finalHomeGoals: row.final_home_goals ?? null,
    finalAwayGoals: row.final_away_goals ?? null,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Data copied from the fixture when a prediction is created. The score is
 * stored with the prediction so the history never needs an API request.
 */
export type PredictionFixture = {
  fixtureId: number;
  leagueId: number | null;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  kickoffAt: string;
};

export type PredictionInput = PredictionFixture & {
  homeGoals: number;
  awayGoals: number;
};

export function draftFromFixture(fixture: Fixture): PredictionFixture {
  return {
    fixtureId: fixture.fixture.id,
    leagueId: fixture.league.id,
    homeTeamId: fixture.teams.home.id,
    homeTeamName: fixture.teams.home.name,
    awayTeamId: fixture.teams.away.id,
    awayTeamName: fixture.teams.away.name,
    kickoffAt: fixture.fixture.date,
  };
}
