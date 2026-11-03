/**
 * Types for the subset of API-Football (v3) we consume.
 *
 * Docs: https://www.api-football.com/documentation-v3
 */

export type ApiFootballErrors = Record<string, string> | unknown[];

export type ApiFootballResponse<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: ApiFootballErrors;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
};

/** Status codes documented by API-Football. */
export type FixtureStatusShort =
  | 'TBD'
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'ET'
  | 'BT'
  | 'P'
  | 'SUSP'
  | 'INT'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'PST'
  | 'CANC'
  | 'ABD'
  | 'AWD'
  | 'WO'
  | 'LIVE';

export type FixtureTeam = {
  id: number;
  name: string;
  logo: string;
};

export type FixtureTeamWithWinner = FixtureTeam & {
  winner: boolean | null;
};

export type FixtureStatus = {
  long: string;
  short: FixtureStatusShort;
  elapsed: number | null;
  extra: number | null;
};

export type FixtureLeague = {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
  standings?: boolean;
};

export type FixtureVenue = {
  id: number | null;
  name: string | null;
  city: string | null;
};

export type FixtureGoals = {
  home: number | null;
  away: number | null;
};

export type FixtureScoreLine = {
  home: number | null;
  away: number | null;
};

export type FixtureScore = {
  halftime: FixtureScoreLine;
  fulltime: FixtureScoreLine;
  extratime: FixtureScoreLine;
  penalty: FixtureScoreLine;
};

export type Fixture = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: FixtureVenue;
    status: FixtureStatus;
  };
  league: FixtureLeague;
  teams: {
    home: FixtureTeamWithWinner;
    away: FixtureTeamWithWinner;
  };
  goals: FixtureGoals;
  score: FixtureScore;
};

export type FixtureEventPlayer = {
  id: number | null;
  name: string | null;
};

export type FixtureEvent = {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: FixtureTeam;
  player: FixtureEventPlayer;
  assist: FixtureEventPlayer;
  type: string;
  detail: string;
  comments: string | null;
};

export type LineupPlayer = {
  /** API-Football can return `null` for players without a registered id. */
  id: number | null;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
};

export type FixtureLineup = {
  team: FixtureTeam & {
    colors: unknown;
  };
  formation: string | null;
  coach: {
    id: number;
    name: string;
    photo: string | null;
  };
  startXI: {
    player: LineupPlayer;
  }[];
  substitutes: {
    player: LineupPlayer;
  }[];
};

export type FixtureStatistic = {
  type: string;
  value: number | string | null;
};

export type FixtureTeamStatistics = {
  team: FixtureTeam;
  statistics: FixtureStatistic[];
};
