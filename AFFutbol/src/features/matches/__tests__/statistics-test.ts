import type { FixtureTeamStatistics } from '@/services/api-football/types';

import { buildStatRows, formatStatValue, parseStatValue } from '../statistics';

const home: FixtureTeamStatistics = {
  team: { id: 1, name: 'Local', logo: '' },
  statistics: [
    { type: 'Ball Possession', value: '61%' },
    { type: 'Total Shots', value: 12 },
    { type: 'Red Cards', value: 0 },
  ],
};

const away: FixtureTeamStatistics = {
  team: { id: 2, name: 'Visitante', logo: '' },
  statistics: [
    { type: 'Ball Possession', value: '39%' },
    { type: 'Total Shots', value: 8 },
    { type: 'Fouls', value: null },
  ],
};

describe('statistics helpers', () => {
  it('parses numeric and percentage values', () => {
    expect(parseStatValue('41%')).toBe(41);
    expect(parseStatValue('1.45')).toBe(1.45);
    expect(parseStatValue(7)).toBe(7);
    expect(parseStatValue(null)).toBeNull();
    expect(parseStatValue('—')).toBeNull();
  });

  it('formats empty values with a dash', () => {
    expect(formatStatValue(null)).toBe('—');
    expect(formatStatValue(0)).toBe('0');
    expect(formatStatValue('61%')).toBe('61%');
  });

  it('pairs both teams into labelled rows with shares', () => {
    const rows = buildStatRows(home, away);
    const possession = rows.find((row) => row.key === 'Ball Possession');
    const shots = rows.find((row) => row.key === 'Total Shots');
    const fouls = rows.find((row) => row.key === 'Fouls');
    const redCards = rows.find((row) => row.key === 'Red Cards');

    expect(rows).toHaveLength(4);
    expect(possession).toMatchObject({
      label: 'Posesión',
      home: '61%',
      away: '39%',
    });
    expect(possession?.homeShare).toBeCloseTo(61);
    expect(shots?.homeShare).toBeCloseTo(60);
    expect(fouls).toMatchObject({ label: 'Faltas', home: '—', away: '—', homeShare: null });
    expect(redCards).toMatchObject({ label: 'Rojas', home: '0', away: '—', homeShare: null });
  });

  it('handles missing teams', () => {
    expect(buildStatRows(undefined, undefined)).toEqual([]);
    expect(buildStatRows(home, undefined).map((row) => row.key)).toEqual([
      'Ball Possession',
      'Total Shots',
      'Red Cards',
    ]);
  });
});
