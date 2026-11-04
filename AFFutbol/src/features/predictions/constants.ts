/** Tunables for the predictions feature. */

/**
 * Scoring rules (see `public.prediction_points()` in the Supabase migration).
 * The client only mirrors them to explain the game; the stored points always
 * come from the database.
 */
export const POINTS_EXACT_SCORE = 10;
export const POINTS_ONE_TEAM = 5;

/** Highest score accepted by the `home_goals`/`away_goals` checks. */
export const MAX_PREDICTED_GOALS = 20;

/**
 * Days ahead offered in "Próximos partidos". API-Football only allows
 * date-based queries on the Free plan, so every day is one request: keep this
 * window small.
 */
export const PREDICTION_WINDOW_DAYS = 3;

/** Upcoming fixtures are cheap to reuse; each day costs one request. */
export const PREDICTION_FIXTURES_STALE_TIME_MS = 15 * 60_000;

/** The user's own predictions only change when the user saves one. */
export const PREDICTIONS_STALE_TIME_MS = 60_000;
