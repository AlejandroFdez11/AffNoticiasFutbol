import type { LineupPlayer } from '@/services/api-football/types';

/**
 * API-Football can return `null` ids for players that are not fully registered.
 * The index keeps the React key unique even when several players lack an id.
 */
export function getLineupPlayerKey(player: LineupPlayer, index: number) {
  return `${player.id ?? 'sin-id'}-${index}`;
}
