/**
 * Statistics domain types.
 *
 * Phase 2 serves a curated sample snapshot per competition. The resolved shape
 * (positions, goal difference and summary) is what the screens render, so a
 * future API-Football standings/scorers integration only needs to produce the
 * stored snapshot and reuse `logic.ts`.
 */

export type LeagueId = 'laliga' | 'premier' | 'seriea' | 'bundesliga';

export type TeamRef = {
  name: string;
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
  assists: number;
  matches: number;
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
};
