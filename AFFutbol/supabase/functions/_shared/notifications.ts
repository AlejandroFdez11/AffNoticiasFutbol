/**
 * Pure helpers shared by the `send-push` Edge Function.
 *
 * No Deno globals and no network here, so Jest covers them just like
 * `_shared/settle.ts` and `_shared/normalize.ts`.
 */

export type PushKind = 'match_reminder' | 'result' | 'ranking';

export type NotificationCopy = {
  title: string;
  body: string;
  data: { url: string };
};

/** How long before kickoff the reminder goes out. */
export const REMINDER_LEAD_MINUTES = 60;
/** The cron runs every 10 minutes, so accept a small clock drift. */
export const REMINDER_TOLERANCE_MINUTES = 10;
/** At most one ranking notification per scope in this window. */
export const RANKING_THROTTLE_MINUTES = 360;
/** Expo Push Service accepts up to 100 messages per request. */
export const EXPO_PUSH_BATCH_SIZE = 100;
/** Scope of the world leaderboard, mirrors `ranking_positions()`. */
export const GLOBAL_SCOPE_KEY = 'global';
export const LEAGUE_SCOPE_PREFIX = 'league:';

export function formatScore(homeGoals: number, awayGoals: number): string {
  return `${homeGoals}-${awayGoals}`;
}

/** Spanish ordinal used by the ranking copy: 1 -> "1.º". */
export function formatPosition(position: number): string {
  return `${position}.º`;
}

export function formatMinutesUntil(minutes: number): string {
  if (minutes <= 1) {
    return 'en 1 minuto';
  }

  if (minutes < 60) {
    return `en ${minutes} minutos`;
  }

  const hours = Math.round(minutes / 60);
  return hours <= 1 ? 'en 1 hora' : `en ${hours} horas`;
}

export function minutesUntil(kickoffAt: Date, now: Date): number {
  return Math.round((kickoffAt.getTime() - now.getTime()) / 60_000);
}

/** True when the kickoff is inside the reminder window (60' ± 10'). */
export function isInReminderWindow(kickoffAt: Date, now: Date): boolean {
  if (Number.isNaN(kickoffAt.getTime())) {
    return false;
  }

  const minutes = minutesUntil(kickoffAt, now);
  return (
    minutes >= REMINDER_LEAD_MINUTES - REMINDER_TOLERANCE_MINUTES &&
    minutes <= REMINDER_LEAD_MINUTES + REMINDER_TOLERANCE_MINUTES
  );
}

export type ReminderInput = {
  fixtureId: number;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: Date;
  now: Date;
  prediction: { homeGoals: number; awayGoals: number } | null;
};

export function buildReminderCopy(input: ReminderInput): NotificationCopy {
  const minutes = Math.max(0, minutesUntil(input.kickoffAt, input.now));
  const fixture = `${input.homeTeamName} vs ${input.awayTeamName}`;

  if (input.prediction) {
    return {
      title: `${fixture} ${formatMinutesUntil(minutes)}`,
      body: `Tu pronóstico: ${formatScore(
        input.prediction.homeGoals,
        input.prediction.awayGoals
      )}. Se cierra al inicio.`,
      data: { url: `/match/${input.fixtureId}` },
    };
  }

  return {
    title: `${fixture} ${formatMinutesUntil(minutes)}`,
    body: 'Aún estás a tiempo de pronosticar. El plazo cierra al inicio.',
    data: { url: '/predictions' },
  };
}

export type ResultInput = {
  status: 'settled' | 'void';
  points: number | null;
  homeTeamName: string;
  awayTeamName: string;
  prediction: { homeGoals: number; awayGoals: number };
  finalScore: { homeGoals: number; awayGoals: number } | null;
};

export function buildResultCopy(input: ResultInput): NotificationCopy {
  const fixture = `${input.homeTeamName} vs ${input.awayTeamName}`;

  if (input.status === 'void' || !input.finalScore) {
    return {
      title: 'Partido sin resultado',
      body: `${fixture}. Tu pronóstico no cuenta y no se han sumado puntos.`,
      data: { url: '/predictions' },
    };
  }

  const score = formatScore(input.finalScore.homeGoals, input.finalScore.awayGoals);
  const predicted = formatScore(input.prediction.homeGoals, input.prediction.awayGoals);
  const points = input.points ?? 0;
  const body = `${fixture} ${score}. Tu pronóstico era ${predicted}.`;

  if (points === 10) {
    return { title: '¡Marcador exacto! +10 puntos', body, data: { url: '/predictions' } };
  }

  if (points === 5) {
    return { title: '+5 puntos', body, data: { url: '/predictions' } };
  }

  return { title: 'Sin puntos esta vez', body, data: { url: '/predictions' } };
}

export type RankingChangeInput = {
  scopeKey: string;
  leagueName?: string | null;
  previous: number;
  current: number;
};

export function buildRankingCopy(input: RankingChangeInput): NotificationCopy {
  const isGlobal = input.scopeKey === GLOBAL_SCOPE_KEY;
  const title = isGlobal ? 'Ranking mundial' : `Liga ${input.leagueName ?? 'privada'}`;
  const movement =
    input.current < input.previous
      ? `Subes al puesto ${formatPosition(input.current)} (antes ${formatPosition(input.previous)}).`
      : `Bajas al puesto ${formatPosition(input.current)} (antes ${formatPosition(input.previous)}).`;

  return { title, body: movement, data: { url: '/rankings' } };
}

export function reminderDedupeKey(fixtureId: number): string {
  return `fixture:${fixtureId}`;
}

export function resultDedupeKey(predictionId: string): string {
  return `prediction:${predictionId}`;
}

/** `<scope>|<position>|<day>`: unique per user, scope and day. */
export function rankingDedupeKey(scopeKey: string, position: number, now: Date): string {
  return `${scopeKey}|${position}|${now.toISOString().slice(0, 10)}`;
}

export function rankingDedupeScope(dedupeKey: string): string {
  const separator = dedupeKey.indexOf('|');
  return separator === -1 ? dedupeKey : dedupeKey.slice(0, separator);
}

export function leagueScopeKey(leagueId: string): string {
  return `${LEAGUE_SCOPE_PREFIX}${leagueId}`;
}

export function readLeagueId(scopeKey: string): string | null {
  return scopeKey.startsWith(LEAGUE_SCOPE_PREFIX)
    ? scopeKey.slice(LEAGUE_SCOPE_PREFIX.length)
    : null;
}

/** Splits a list into chunks of at most `size` items. */
export function chunk<T>(items: readonly T[], size = EXPO_PUSH_BATCH_SIZE): T[][] {
  const safeSize = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }

  return chunks;
}

export type ExpoTicket = {
  status?: string;
  message?: string;
  details?: { error?: string; [key: string]: unknown };
};

/** Normalises the `data` field of an Expo push response (array or object). */
export function readTickets(payload: unknown): ExpoTicket[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = (payload as { data?: unknown }).data;

  if (Array.isArray(data)) {
    return data as ExpoTicket[];
  }

  if (data && typeof data === 'object') {
    return [data as ExpoTicket];
  }

  return [];
}

/**
 * Tokens Expo reported as no longer valid (`DeviceNotRegistered`), in the same
 * order as the messages that were sent, so the caller can delete them.
 */
export function readInvalidTokens(tokens: readonly string[], payload: unknown): string[] {
  const tickets = readTickets(payload);
  const invalid: string[] = [];

  tickets.forEach((ticket, index) => {
    if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      const token = tokens[index];

      if (token) {
        invalid.push(token);
      }
    }
  });

  return invalid;
}

/** Indexes of the messages Expo accepted, to record them in the delivery log. */
export function readDeliveredIndexes(payload: unknown): number[] {
  const tickets = readTickets(payload);
  const delivered: number[] = [];

  tickets.forEach((ticket, index) => {
    if (ticket?.status === 'ok') {
      delivered.push(index);
    }
  });

  return delivered;
}
