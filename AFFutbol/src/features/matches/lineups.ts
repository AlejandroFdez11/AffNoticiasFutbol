import type { LineupPlayer } from '@/services/api-football/types';

/**
 * API-Football can return `null` ids for players that are not fully registered.
 * The index keeps the React key unique even when several players lack an id.
 */
export function getLineupPlayerKey(player: LineupPlayer, index: number) {
  return `${player.id ?? 'sin-id'}-${index}`;
}

export type LineupGrid = { row: number; column: number };

export type LineupRow = {
  /** 1 is the goalkeeper line, as returned by API-Football. */
  row: number;
  /** Left to right, as returned by API-Football. */
  players: LineupPlayer[];
};

/**
 * `grid` is `"row:column"` (`"1:1"` is the goalkeeper). Anything that is not a
 * positive pair is treated as missing so the caller can fall back to a list.
 */
export function parseLineupGrid(grid: string | null | undefined): LineupGrid | null {
  if (!grid) return null;

  const [row, column] = grid.split(':').map((value) => Number.parseInt(value, 10));

  if (!Number.isInteger(row) || !Number.isInteger(column)) return null;
  if (row < 1 || column < 1) return null;

  return { row, column };
}

/**
 * Groups the starting eleven by pitch line. Returns `null` when the API omits
 * the grid of any starter (or sends no starters at all): a partial pitch would
 * hide players, so the caller keeps the plain list in that case.
 */
export function buildLineupRows(players: readonly LineupPlayer[]): LineupRow[] | null {
  const entries: { player: LineupPlayer; grid: LineupGrid }[] = [];

  for (const player of players) {
    const grid = parseLineupGrid(player.grid);

    if (!grid) return null;

    entries.push({ player, grid });
  }

  if (entries.length === 0) return null;

  const byRow = new Map<number, { column: number; player: LineupPlayer }[]>();

  for (const { player, grid } of entries) {
    const bucket = byRow.get(grid.row) ?? [];
    bucket.push({ column: grid.column, player });
    byRow.set(grid.row, bucket);
  }

  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, bucket]) => ({
      row,
      players: bucket.sort((a, b) => a.column - b.column).map((entry) => entry.player),
    }));
}
