import { render } from '@testing-library/react-native';

import type { FixtureLineup, LineupPlayer } from '@/services/api-football/types';

import { buildLineupRows, getLineupPlayerKey, parseLineupGrid } from '../lineups';
import { LineupsView } from '../components/lineups-view';

function player(
  id: number | null,
  name: string,
  number: number,
  grid: string | null = null
): LineupPlayer {
  return { id, name, number, pos: 'M', grid };
}

function lineup(teamId: number, players: LineupPlayer[]): FixtureLineup {
  return {
    team: { id: teamId, name: `Equipo ${teamId}`, logo: '', colors: null },
    formation: '4-3-3',
    coach: { id: 1, name: 'Entrenador', photo: null },
    startXI: players.map((entry) => ({ player: entry })),
    substitutes: [],
  };
}

describe('getLineupPlayerKey', () => {
  it('keeps keys unique when the API returns null player ids', () => {
    const first = player(null, 'Jugador Uno', 1);
    const second = player(null, 'Jugador Dos', 2);

    expect(getLineupPlayerKey(first, 0)).toBe('sin-id-0');
    expect(getLineupPlayerKey(first, 0)).not.toBe(getLineupPlayerKey(second, 1));
  });
});

describe('parseLineupGrid', () => {
  it('reads the row:column pair', () => {
    expect(parseLineupGrid('1:1')).toEqual({ row: 1, column: 1 });
    expect(parseLineupGrid('4:3')).toEqual({ row: 4, column: 3 });
  });

  it('rejects missing or malformed values', () => {
    expect(parseLineupGrid(null)).toBeNull();
    expect(parseLineupGrid(undefined)).toBeNull();
    expect(parseLineupGrid('')).toBeNull();
    expect(parseLineupGrid('1')).toBeNull();
    expect(parseLineupGrid('a:b')).toBeNull();
    expect(parseLineupGrid('0:1')).toBeNull();
  });
});

describe('buildLineupRows', () => {
  it('groups by line, goalkeeper first and players left to right', () => {
    const rows = buildLineupRows([
      player(3, 'Delantero', 9, '3:1'),
      player(1, 'Portero', 1, '1:1'),
      player(4, 'Central Derecho', 4, '2:2'),
      player(5, 'Central Izquierdo', 5, '2:1'),
    ]);

    expect(rows?.map((row) => row.row)).toEqual([1, 2, 3]);
    expect(rows?.[0].players.map((entry) => entry.name)).toEqual(['Portero']);
    expect(rows?.[1].players.map((entry) => entry.name)).toEqual([
      'Central Izquierdo',
      'Central Derecho',
    ]);
  });

  it('returns null when any starter has no usable grid', () => {
    expect(
      buildLineupRows([player(1, 'Portero', 1, '1:1'), player(2, 'Duda', 2)])
    ).toBeNull();
  });

  it('returns null for an empty eleven', () => {
    expect(buildLineupRows([])).toBeNull();
  });
});

describe('LineupsView', () => {
  it('renders players whose ids are null', async () => {
    const { getByText } = await render(
      <LineupsView
        lineups={[
          lineup(1, [player(null, 'Jugador Uno', 1), player(null, 'Jugador Dos', 2)]),
        ]}
      />
    );

    expect(getByText('Jugador Uno')).toBeTruthy();
    expect(getByText('Jugador Dos')).toBeTruthy();
  });

  it('falls back to the list when the API sends no grid', async () => {
    const { getByText, queryByTestId } = await render(
      <LineupsView lineups={[lineup(1, [player(1, 'Jugador Uno', 1)])]} />
    );

    expect(queryByTestId('lineup-pitch')).toBeNull();
    expect(getByText('Titulares')).toBeTruthy();
  });

  it('draws the starting eleven on the pitch when the grid is complete', async () => {
    const { getByTestId, getByText, queryByText } = await render(
      <LineupsView
        lineups={[
          lineup(1, [
            player(1, 'Portero', 1, '1:1'),
            player(2, 'Lateral', 2, '2:1'),
            player(3, 'Extremo', 3, '3:1'),
          ]),
        ]}
      />
    );

    expect(getByTestId('lineup-pitch')).toBeTruthy();
    expect(queryByText('Titulares')).toBeNull();
    expect(getByText('Portero')).toBeTruthy();
    expect(getByText('Lateral')).toBeTruthy();
    expect(getByText('Extremo')).toBeTruthy();
  });
});
