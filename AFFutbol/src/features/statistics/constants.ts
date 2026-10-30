import type { LeagueId } from './types';

export const LEAGUE_OPTIONS: readonly { key: LeagueId; label: string }[] = [
  { key: 'laliga', label: 'LaLiga' },
  { key: 'premier', label: 'Premier' },
  { key: 'seriea', label: 'Serie A' },
  { key: 'bundesliga', label: 'Bundes' },
];
