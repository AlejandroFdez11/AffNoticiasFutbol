import type { Fixture, FixtureStatusShort } from '@/services/api-football/types';

type FixtureOptions = {
  id: number;
  leagueId: number;
  leagueName?: string;
  country?: string;
  status?: FixtureStatusShort;
  /** Local timestamp, defaults to 2026-10-30 21:00. */
  timestamp?: number;
  goals?: { home: number | null; away: number | null };
};

/** Builds a `Fixture` with sensible defaults for unit tests. */
export function makeFixture({
  id,
  leagueId,
  leagueName,
  country = 'Spain',
  status = 'NS',
  timestamp = new Date(2026, 9, 30, 21, 0, 0).getTime(),
  goals = { home: null, away: null },
}: FixtureOptions): Fixture {
  const name = leagueName ?? `Liga ${leagueId}`;
  const isLive = status === '2H' || status === '1H' || status === 'HT';
  const isFinished = status === 'FT' || status === 'AET' || status === 'PEN';

  return {
    fixture: {
      id,
      referee: null,
      timezone: 'UTC',
      date: new Date(timestamp).toISOString(),
      timestamp: Math.floor(timestamp / 1000),
      periods: { first: null, second: null },
      venue: { id: null, name: null, city: null },
      status: {
        long: status,
        short: status,
        elapsed: isLive ? 60 : isFinished ? 90 : null,
        extra: null,
      },
    },
    league: {
      id: leagueId,
      name,
      country,
      logo: `https://media.api-sports.io/football/leagues/${leagueId}.png`,
      flag: null,
      season: 2026,
      round: 'Regular Season - 10',
    },
    teams: {
      home: {
        id: leagueId * 10 + 1,
        name: `Local ${leagueId}`,
        logo: '',
        winner: goals.home === null || goals.away === null ? null : goals.home > goals.away,
      },
      away: {
        id: leagueId * 10 + 2,
        name: `Visitante ${leagueId}`,
        logo: '',
        winner: goals.home === null || goals.away === null ? null : goals.away > goals.home,
      },
    },
    goals,
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}
