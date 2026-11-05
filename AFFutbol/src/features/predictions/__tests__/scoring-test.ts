import {
  calculatePredictionPoints,
  getOutcomeLabel,
  getPredictionOutcome,
  summarizePredictions,
} from '../scoring';
import type { Prediction, PredictionStatus } from '../types';

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'prediction-1',
    fixtureId: 1,
    leagueId: 140,
    homeTeamId: 10,
    homeTeamName: 'Local',
    awayTeamId: 20,
    awayTeamName: 'Visitante',
    kickoffAt: '2026-11-06T20:00:00.000Z',
    homeGoals: 2,
    awayGoals: 1,
    status: 'settled' as PredictionStatus,
    points: 10,
    finalHomeGoals: 2,
    finalAwayGoals: 1,
    settledAt: '2026-11-06T22:00:00.000Z',
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-06T22:00:00.000Z',
    ...overrides,
  };
}

describe('calculatePredictionPoints', () => {
  it('awards 10 points for the exact score', () => {
    expect(calculatePredictionPoints(2, 1, 2, 1)).toBe(10);
    expect(calculatePredictionPoints(0, 0, 0, 0)).toBe(10);
  });

  it('awards 5 points when only one team is correct', () => {
    expect(calculatePredictionPoints(2, 1, 2, 0)).toBe(5);
    expect(calculatePredictionPoints(2, 1, 3, 1)).toBe(5);
  });

  it('awards 0 points when neither team is correct', () => {
    expect(calculatePredictionPoints(1, 0, 2, 1)).toBe(0);
  });
});

describe('getPredictionOutcome', () => {
  it('maps pending and void rows', () => {
    expect(getPredictionOutcome(makePrediction({ status: 'pending', points: null }))).toBe(
      'pending'
    );
    expect(getPredictionOutcome(makePrediction({ status: 'void', points: null }))).toBe('void');
  });

  it('maps settled rows by stored points', () => {
    expect(getPredictionOutcome(makePrediction({ points: 10 }))).toBe('exact');
    expect(getPredictionOutcome(makePrediction({ points: 5 }))).toBe('partial');
    expect(getPredictionOutcome(makePrediction({ points: 0 }))).toBe('miss');
  });
});

describe('getOutcomeLabel', () => {
  it('returns Spanish copy for every outcome', () => {
    expect(getOutcomeLabel('exact')).toBe('Marcador exacto');
    expect(getOutcomeLabel('partial')).toBe('Un equipo acertado');
    expect(getOutcomeLabel('miss')).toBe('Sin acierto');
    expect(getOutcomeLabel('void')).toBe('Anulado');
    expect(getOutcomeLabel('pending')).toBe('Pendiente');
  });
});

describe('summarizePredictions', () => {
  it('adds points and counts each outcome', () => {
    const summary = summarizePredictions([
      makePrediction({ id: 'exact', points: 10 }),
      makePrediction({ id: 'partial', points: 5 }),
      makePrediction({ id: 'miss', points: 0 }),
      makePrediction({ id: 'pending', status: 'pending', points: null }),
      makePrediction({ id: 'void', status: 'void', points: null }),
    ]);

    expect(summary).toEqual({
      totalPoints: 15,
      predictions: 5,
      settled: 3,
      pending: 1,
      voided: 1,
      exact: 1,
      partial: 1,
      misses: 1,
      hitRate: 2 / 3,
    });
  });

  it('returns a null hit rate when nothing is settled', () => {
    const summary = summarizePredictions([
      makePrediction({ status: 'pending', points: null }),
    ]);

    expect(summary.hitRate).toBeNull();
    expect(summary.totalPoints).toBe(0);
  });
});
