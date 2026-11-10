/**
 * Statistics domain types.
 *
 * Standings come from football-data.org and scorers from Wikipedia; the
 * `sync-statistics` Edge Function stores one snapshot per league in Supabase.
 * `data.ts` is only the offline sample fallback. The resolved shape (positions,
 * goal difference and summary) is what the screens render, so the screens only
 * need `logic.ts`.
 */

export type LeagueId = 'laliga' | 'premier' | 'seriea' | 'bundesliga';

export type TeamRef = {
  name: string;
  /** Compact label for tight UI (tables). `name` stays the matching key. */
  shortName?: string;
  logo?: string;
};

export type FormResult = 'W' | 'D' | 'L';

export type StandingRow = {
  team: TeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Last five results, oldest first. */
  form: FormResult[];
};

export type ScorerRow = {
  player: string;
  team: TeamRef;
  goals: number;
  /** Not published by the free sources; the UI hides the column when absent. */
  assists?: number;
  /** Not published by the free sources. */
  matches?: number;
};

export type LeagueInfo = {
  id: LeagueId;
  name: string;
  shortName: string;
  country: string;
  logo: string;
  season: string;
};

export type StoredLeagueSnapshot = {
  league: LeagueInfo;
  standings: StandingRow[];
  scorers: ScorerRow[];
};

export type PositionedStanding = StandingRow & {
  position: number;
  goalDifference: number;
};

export type LeagueSummary = {
  matches: number;
  goals: number;
  goalsPerMatch: number;
  leader: PositionedStanding;
  bestAttack: PositionedStanding;
  bestDefense: PositionedStanding;
};

export type LeagueSnapshot = Omit<StoredLeagueSnapshot, 'standings'> & {
  standings: PositionedStanding[];
  summary: LeagueSummary;
  /** True when the numbers come from the bundled sample set, not Supabase. */
  isSample: boolean;
};
