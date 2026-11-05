import {
  buildRankingCopy,
  buildReminderCopy,
  buildResultCopy,
  chunk,
  formatMinutesUntil,
  formatPosition,
  formatScore,
  isInReminderWindow,
  leagueScopeKey,
  readDeliveredIndexes,
  readInvalidTokens,
  readLeagueId,
  rankingDedupeKey,
  rankingDedupeScope,
  reminderDedupeKey,
  resultDedupeKey,
} from '../../../../supabase/functions/_shared/notifications';

const NOW = new Date('2026-11-05T18:00:00.000Z');
const KICKOFF = new Date('2026-11-05T19:00:00.000Z');

function minutesFromNow(minutes: number): Date {
  return new Date(NOW.getTime() + minutes * 60_000);
}

describe('formatScore', () => {
  it('joins both scores', () => {
    expect(formatScore(2, 1)).toBe('2-1');
    expect(formatScore(0, 0)).toBe('0-0');
  });
});

describe('formatPosition', () => {
  it('uses the Spanish ordinal', () => {
    expect(formatPosition(1)).toBe('1.º');
    expect(formatPosition(12)).toBe('12.º');
  });
});

describe('formatMinutesUntil', () => {
  it('handles minutes and hours', () => {
    expect(formatMinutesUntil(0)).toBe('en 1 minuto');
    expect(formatMinutesUntil(1)).toBe('en 1 minuto');
    expect(formatMinutesUntil(5)).toBe('en 5 minutos');
    expect(formatMinutesUntil(59)).toBe('en 59 minutos');
    expect(formatMinutesUntil(60)).toBe('en 1 hora');
    expect(formatMinutesUntil(65)).toBe('en 1 hora');
    expect(formatMinutesUntil(90)).toBe('en 2 horas');
  });
});

describe('isInReminderWindow', () => {
  it('accepts kickoffs one hour away, with a ten minute tolerance', () => {
    expect(isInReminderWindow(minutesFromNow(60), NOW)).toBe(true);
    expect(isInReminderWindow(minutesFromNow(50), NOW)).toBe(true);
    expect(isInReminderWindow(minutesFromNow(70), NOW)).toBe(true);
  });

  it('ignores kickoffs outside the window', () => {
    expect(isInReminderWindow(minutesFromNow(45), NOW)).toBe(false);
    expect(isInReminderWindow(minutesFromNow(75), NOW)).toBe(false);
    expect(isInReminderWindow(minutesFromNow(-5), NOW)).toBe(false);
  });

  it('ignores invalid dates', () => {
    expect(isInReminderWindow(new Date('nope'), NOW)).toBe(false);
  });
});

describe('buildReminderCopy', () => {
  const base = {
    fixtureId: 1234,
    homeTeamName: 'Betis',
    awayTeamName: 'Sevilla',
    kickoffAt: KICKOFF,
    now: NOW,
  };

  it('reminds the predicted score when the user already predicted', () => {
    expect(
      buildReminderCopy({ ...base, prediction: { homeGoals: 2, awayGoals: 1 } })
    ).toEqual({
      title: 'Betis vs Sevilla en 1 hora',
      body: 'Tu pronóstico: 2-1. Se cierra al inicio.',
      data: { url: '/match/1234' },
    });
  });

  it('nudges users who have not predicted yet', () => {
    expect(buildReminderCopy({ ...base, prediction: null })).toEqual({
      title: 'Betis vs Sevilla en 1 hora',
      body: 'Aún estás a tiempo de pronosticar. El plazo cierra al inicio.',
      data: { url: '/predictions' },
    });
  });
});

describe('buildResultCopy', () => {
  const base = {
    status: 'settled' as const,
    homeTeamName: 'Betis',
    awayTeamName: 'Sevilla',
    prediction: { homeGoals: 2, awayGoals: 1 },
    finalScore: { homeGoals: 2, awayGoals: 1 },
  };

  it('celebrates an exact score', () => {
    expect(buildResultCopy({ ...base, points: 10 })).toEqual({
      title: '¡Marcador exacto! +10 puntos',
      body: 'Betis vs Sevilla 2-1. Tu pronóstico era 2-1.',
      data: { url: '/predictions' },
    });
  });

  it('reports five points', () => {
    expect(buildResultCopy({ ...base, points: 5 }).title).toBe('+5 puntos');
  });

  it('reports no points', () => {
    expect(buildResultCopy({ ...base, points: 0 }).title).toBe('Sin puntos esta vez');
  });

  it('explains voided matches', () => {
    expect(buildResultCopy({ ...base, status: 'void', points: null })).toEqual({
      title: 'Partido sin resultado',
      body: 'Betis vs Sevilla. Tu pronóstico no cuenta y no se han sumado puntos.',
      data: { url: '/predictions' },
    });
  });

  it('treats a settled match without final score as void', () => {
    expect(buildResultCopy({ ...base, points: null, finalScore: null }).title).toBe(
      'Partido sin resultado'
    );
  });
});

describe('buildRankingCopy', () => {
  it('announces a climb in the global leaderboard', () => {
    expect(buildRankingCopy({ scopeKey: 'global', previous: 7, current: 3 })).toEqual({
      title: 'Ranking mundial',
      body: 'Subes al puesto 3.º (antes 7.º).',
      data: { url: '/rankings' },
    });
  });

  it('announces a fall in the global leaderboard', () => {
    expect(buildRankingCopy({ scopeKey: 'global', previous: 4, current: 9 }).body).toBe(
      'Bajas al puesto 9.º (antes 4.º).'
    );
  });

  it('names the private league', () => {
    expect(
      buildRankingCopy({
        scopeKey: 'league:8f14e45f-ceea-467f-a1b2-1f0f9f9d1e2a',
        leagueName: 'Los del curro',
        previous: 2,
        current: 1,
      })
    ).toEqual({
      title: 'Liga Los del curro',
      body: 'Subes al puesto 1.º (antes 2.º).',
      data: { url: '/rankings' },
    });
  });

  it('falls back to a generic league name', () => {
    expect(
      buildRankingCopy({
        scopeKey: 'league:8f14e45f-ceea-467f-a1b2-1f0f9f9d1e2a',
        previous: 1,
        current: 2,
      }).title
    ).toBe('Liga privada');
  });
});

describe('dedupe keys', () => {
  it('keys reminders by fixture', () => {
    expect(reminderDedupeKey(1234)).toBe('fixture:1234');
  });

  it('keys results by prediction', () => {
    expect(resultDedupeKey('abc')).toBe('prediction:abc');
  });

  it('keys rankings by scope, position and day', () => {
    expect(rankingDedupeKey('global', 4, NOW)).toBe('global|4|2026-11-05');
  });

  it('reads the scope back from a ranking key', () => {
    expect(rankingDedupeScope('global|4|2026-11-05')).toBe('global');
    expect(rankingDedupeScope('league:abc|2|2026-11-05')).toBe('league:abc');
    expect(rankingDedupeScope('global')).toBe('global');
  });
});

describe('league scopes', () => {
  it('round-trips the league id', () => {
    const scopeKey = leagueScopeKey('8f14e45f-ceea-467f-a1b2-1f0f9f9d1e2a');

    expect(scopeKey).toBe('league:8f14e45f-ceea-467f-a1b2-1f0f9f9d1e2a');
    expect(readLeagueId(scopeKey)).toBe('8f14e45f-ceea-467f-a1b2-1f0f9f9d1e2a');
  });

  it('returns null for the global scope', () => {
    expect(readLeagueId('global')).toBeNull();
  });
});

describe('chunk', () => {
  it('splits into batches of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('never returns empty batches', () => {
    expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
    expect(chunk([], 10)).toEqual([]);
  });
});

describe('Expo tickets', () => {
  const payload = {
    data: [
      { status: 'ok', id: '1' },
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', message: 'big', details: { error: 'MessageTooBig' } },
    ],
  };

  it('returns the tokens Expo rejected as unregistered', () => {
    expect(readInvalidTokens(['a', 'b', 'c'], payload)).toEqual(['b']);
  });

  it('returns the indexes Expo accepted', () => {
    expect(readDeliveredIndexes(payload)).toEqual([0]);
  });

  it('accepts a single-ticket response', () => {
    expect(readDeliveredIndexes({ data: { status: 'ok' } })).toEqual([0]);
  });

  it('ignores payloads without tickets', () => {
    expect(readDeliveredIndexes(null)).toEqual([]);
    expect(readInvalidTokens(['a'], { data: 'nope' })).toEqual([]);
  });
});
