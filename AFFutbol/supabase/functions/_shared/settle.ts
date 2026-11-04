/**
 * Pure helpers shared by the `settle-predictions` Edge Function.
 *
 * They live here (no Deno globals, no network) so Jest can cover them, exactly
 * like `_shared/normalize.ts` does for the news refresh.
 */

export type SettleAction = 'settle' | 'void' | 'wait';

export type FixtureResult = {
  fixtureId: number;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type SettlementDecision =
  | { action: 'settle'; homeGoals: number; awayGoals: number }
  | { action: 'void' }
  | { action: 'wait' };

/** API-Football statuses with a final score (penalties use the 120' score). */
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

/** Postponed or cancelled matches: close the prediction without points. */
const VOID_STATUSES = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP']);

export function classifyFixtureStatus(status: string): SettleAction {
  if (FINISHED_STATUSES.has(status)) {
    return 'settle';
  }

  if (VOID_STATUSES.has(status)) {
    return 'void';
  }

  return 'wait';
}

export function decideSettlement(result: FixtureResult): SettlementDecision {
  const action = classifyFixtureStatus(result.status);

  if (action === 'settle' && result.homeGoals !== null && result.awayGoals !== null) {
    return { action: 'settle', homeGoals: result.homeGoals, awayGoals: result.awayGoals };
  }

  if (action === 'void') {
    return { action: 'void' };
  }

  return { action: 'wait' };
}

type ApiFixture = {
  fixture?: { id?: number; status?: { short?: string } };
  goals?: { home?: number | null; away?: number | null };
};

/**
 * Reads the first fixture of an API-Football `/fixtures?id=` response. Returns
 * `null` when the payload does not look like a fixture.
 */
export function readFixtureResult(payload: unknown): FixtureResult | null {
  const first = Array.isArray(payload) ? payload[0] : payload;

  if (!first || typeof first !== 'object') {
    return null;
  }

  const fixture = (first as ApiFixture).fixture;
  const fixtureId = fixture?.id;
  const status = fixture?.status?.short;

  if (typeof fixtureId !== 'number' || typeof status !== 'string') {
    return null;
  }

  const goals = (first as ApiFixture).goals;

  return {
    fixtureId,
    status,
    homeGoals: typeof goals?.home === 'number' ? goals.home : null,
    awayGoals: typeof goals?.away === 'number' ? goals.away : null,
  };
}
