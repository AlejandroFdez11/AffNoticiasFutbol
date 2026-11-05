import {
  classifyFixtureStatus,
  decideSettlement,
  readFixtureResult,
} from '../../../../supabase/functions/_shared/settle';

describe('classifyFixtureStatus', () => {
  it('settles matches with a final score', () => {
    expect(classifyFixtureStatus('FT')).toBe('settle');
    expect(classifyFixtureStatus('AET')).toBe('settle');
    expect(classifyFixtureStatus('PEN')).toBe('settle');
  });

  it('voids postponed, cancelled or abandoned matches', () => {
    for (const status of ['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP']) {
      expect(classifyFixtureStatus(status)).toBe('void');
    }
  });

  it('waits for every other status', () => {
    expect(classifyFixtureStatus('NS')).toBe('wait');
    expect(classifyFixtureStatus('2H')).toBe('wait');
  });
});

describe('decideSettlement', () => {
  it('uses the score when the match finished', () => {
    expect(
      decideSettlement({ fixtureId: 1, status: 'FT', homeGoals: 2, awayGoals: 1 })
    ).toEqual({ action: 'settle', homeGoals: 2, awayGoals: 1 });
  });

  it('waits if the final score is missing', () => {
    expect(
      decideSettlement({ fixtureId: 1, status: 'FT', homeGoals: null, awayGoals: null })
    ).toEqual({ action: 'wait' });
  });

  it('voids a postponed match', () => {
    expect(
      decideSettlement({ fixtureId: 1, status: 'PST', homeGoals: null, awayGoals: null })
    ).toEqual({ action: 'void' });
  });
});

describe('readFixtureResult', () => {
  it('prefers the full-time score over the current goals', () => {
    expect(
      readFixtureResult({
        fixture: { id: 42, status: { short: 'FT' } },
        goals: { home: 2, away: 1 },
        score: { fulltime: { home: 3, away: 1 } },
      })
    ).toEqual({ fixtureId: 42, status: 'FT', homeGoals: 3, awayGoals: 1 });
  });

  it('falls back to goals when fulltime is null', () => {
    expect(
      readFixtureResult({
        fixture: { id: 42, status: { short: 'FT' } },
        goals: { home: 0, away: 0 },
        score: { fulltime: { home: null, away: null } },
      })
    ).toEqual({ fixtureId: 42, status: 'FT', homeGoals: 0, awayGoals: 0 });
  });

  it('returns null for malformed payloads', () => {
    expect(readFixtureResult(null)).toBeNull();
    expect(readFixtureResult([])).toBeNull();
    expect(readFixtureResult({ fixture: { status: { short: 'FT' } } })).toBeNull();
  });
});
