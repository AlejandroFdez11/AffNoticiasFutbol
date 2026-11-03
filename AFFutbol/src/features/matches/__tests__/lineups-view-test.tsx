import { render } from '@testing-library/react-native';

import type { FixtureLineup, LineupPlayer } from '@/services/api-football/types';

import { getLineupPlayerKey } from '../lineups';
import { LineupsView } from '../components/lineups-view';

function player(id: number | null, name: string, number: number): LineupPlayer {
  return { id, name, number, pos: 'M', grid: null };
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
});
