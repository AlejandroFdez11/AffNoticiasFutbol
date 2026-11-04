import { POINTS_EXACT_SCORE, POINTS_ONE_TEAM } from './constants';
import type { Prediction, PredictionOutcome } from './types';

/**
 * Mirrors `public.prediction_points()` from the Supabase migration:
 * exact score = 10, one team's goals correct = 5, otherwise 0.
 *
 * Points are always stored by the database (see `settle_fixture`); this helper
 * exists for explanations, optimistic UI and tests.
 */
export function calculatePredictionPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return POINTS_EXACT_SCORE;
  }

  if (predictedHome === actualHome || predictedAway === actualAway) {
    return POINTS_ONE_TEAM;
  }

  return 0;
}

export function getPredictionOutcome(prediction: Prediction): PredictionOutcome {
  if (prediction.status === 'void') {
    return 'void';
  }

  if (prediction.status === 'pending' || prediction.points === null) {
    return 'pending';
  }

  switch (prediction.points) {
    case POINTS_EXACT_SCORE:
      return 'exact';
    case POINTS_ONE_TEAM:
      return 'partial';
    default:
      return 'miss';
  }
}

export function getOutcomeLabel(outcome: PredictionOutcome): string {
  switch (outcome) {
    case 'exact':
      return 'Marcador exacto';
    case 'partial':
      return 'Un equipo acertado';
    case 'miss':
      return 'Sin acierto';
    case 'void':
      return 'Anulado';
    default:
      return 'Pendiente';
  }
}

export type PredictionSummary = {
  totalPoints: number;
  predictions: number;
  settled: number;
  pending: number;
  voided: number;
  exact: number;
  partial: number;
  misses: number;
  /** Share of settled predictions that scored at least 5 points (0..1). */
  hitRate: number | null;
};

export function summarizePredictions(predictions: readonly Prediction[]): PredictionSummary {
  const summary: PredictionSummary = {
    totalPoints: 0,
    predictions: predictions.length,
    settled: 0,
    pending: 0,
    voided: 0,
    exact: 0,
    partial: 0,
    misses: 0,
    hitRate: null,
  };

  for (const prediction of predictions) {
    summary.totalPoints += prediction.points ?? 0;

    switch (getPredictionOutcome(prediction)) {
      case 'exact':
        summary.exact += 1;
        summary.settled += 1;
        break;
      case 'partial':
        summary.partial += 1;
        summary.settled += 1;
        break;
      case 'miss':
        summary.misses += 1;
        summary.settled += 1;
        break;
      case 'void':
        summary.voided += 1;
        break;
      default:
        summary.pending += 1;
        break;
    }
  }

  summary.hitRate =
    summary.settled > 0 ? (summary.exact + summary.partial) / summary.settled : null;

  return summary;
}
