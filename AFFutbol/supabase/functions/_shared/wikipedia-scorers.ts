/**
 * Wikipedia "Top goalscorers" table parser shared by the `sync-statistics` Edge
 * Function and the Jest suite.
 *
 * Wikipedia is the only free source for league scorers: football-data.org puts
 * them behind the paid Deep Data tier. The season articles keep the table by
 * hand, so it is wikitext with `rowspan` ties and template noise. The parser is
 * deliberately defensive — anything it does not understand is skipped instead
 * of guessed, and an empty result makes the caller keep the previous snapshot.
 *
 * Rules for this file: no Deno globals, no Node built-ins and no network.
 */

export type ParsedScorer = {
  player: string;
  team: { name: string };
  goals: number;
};

type Cell = {
  value: string;
  rowspan: number;
};

type Columns = {
  player: number;
  club: number;
  goals: number;
};

/** LaLiga, Serie A and Bundesliga use "Top goalscorers"; the Premier uses "Top scorers". */
const SECTION_HEADING = /^=+\s*(?:Top goalscorers|Top scorers)\s*=+$/m;
const ROW_SEPARATOR = /^\|-.*$/m;

const ATTRIBUTE = /^\s*(rowspan|colspan|align|style|class)\s*=\s*(?:"([^"]*)"|([^\s|]+))\s*/i;
const REF = /<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/gi;
const WRAPPER_TEMPLATE = /\{\{\s*(?:nobreak|nowrap|small)\s*\|([^{}]*)\}\}/gi;
const TEMPLATE = /\{\{[^{}]*\}\}/g;
const WIKI_LINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const EMPHASIS = /'{2,}/g;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
};

function decodeEntities(value: string): string {
  return value.replace(
    /&(?:amp|apos|mdash|ndash|nbsp|quot|#39);/g,
    (match) => ENTITIES[match] ?? match
  );
}

/**
 * Strips the wikitext noise a cell can carry: footnotes, flag icons, wrapper
 * templates, piped links and emphasis. `{{nobreak|Atlético Madrid}}` becomes
 * `Atlético Madrid`; `[[Roberto Fernández (footballer, born 2002)|Roberto
 * Fernández]]` becomes `Roberto Fernández`.
 */
function cleanCell(raw: string): string {
  return decodeEntities(
    raw
      .replace(REF, '')
      .replace(WRAPPER_TEMPLATE, '$1')
      .replace(TEMPLATE, '')
      .replace(WIKI_LINK, (_match, target: string, label?: string) =>
        (label ?? target).trim()
      )
      .replace(EMPHASIS, '')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits a data row into cells, keeping the `rowspan` each one declares. */
function parseCells(row: string): Cell[] {
  const cells: Cell[] = [];

  for (const line of row.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed.startsWith('|') || trimmed.startsWith('|}')) continue;

    for (const part of trimmed.slice(1).split('||')) {
      let rest = part;
      let rowspan = 1;
      let attribute: RegExpExecArray | null;

      while ((attribute = ATTRIBUTE.exec(rest)) !== null) {
        if (attribute[1].toLowerCase() === 'rowspan') {
          rowspan = Number.parseInt(attribute[2] ?? attribute[3] ?? '', 10) || 1;
        }

        rest = rest.slice(attribute[0].length);
      }

      if (rest.startsWith('|')) rest = rest.slice(1);

      const value = cleanCell(rest);
      if (value) cells.push({ value, rowspan });
    }
  }

  return cells;
}

/** Header cells, used to find the player/club/goals columns instead of assuming them. */
function parseHeaderCells(table: string): string[] {
  const cells: string[] = [];

  for (const line of table.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('!')) continue;

    for (const part of trimmed.slice(1).split('||')) {
      const value = cleanCell(part);
      if (value) cells.push(value);
    }
  }

  return cells;
}

function resolveColumns(headerCells: readonly string[]): Columns {
  const find = (pattern: RegExp) => headerCells.findIndex((cell) => pattern.test(cell));

  const player = find(/player/i);
  const club = find(/^(club|team)$/i);
  const goals = find(/^goals?$/i);

  if (player >= 0 && club >= 0 && goals >= 0) return { player, club, goals };

  // No usable header: fall back to the common rank/player/club/goals layout.
  return { player: 1, club: 2, goals: 3 };
}

/**
 * A `rowspan="N"` cell covers the N-1 rows below it, which simply omit that
 * cell. Rebuilding the full matrix here keeps the row loop trivial and is what
 * makes tied positions (rank 6 shared by two players, a club shared by two
 * scorers) read correctly.
 */
function expandRowspans(rows: readonly Cell[][]): string[][] {
  const carry = new Map<number, { value: string; remaining: number }>();
  const matrix: string[][] = [];

  for (const row of rows) {
    const values: string[] = [];
    let column = 0;

    for (const cell of row) {
      let pending = carry.get(column);

      while (pending && pending.remaining > 0) {
        values.push(pending.value);
        pending.remaining -= 1;
        column += 1;
        pending = carry.get(column);
      }

      values.push(cell.value);

      if (cell.rowspan > 1) {
        carry.set(column, { value: cell.value, remaining: cell.rowspan - 1 });
      } else {
        carry.delete(column);
      }

      column += 1;
    }

    let trailing = carry.get(column);
    while (trailing && trailing.remaining > 0) {
      values.push(trailing.value);
      trailing.remaining -= 1;
      column += 1;
      trailing = carry.get(column);
    }

    matrix.push(values);
  }

  return matrix;
}

/**
 * Parses the top-scorer table of a league-season article.
 *
 * @param wikitext raw `prop=wikitext` payload of the page
 * @param maxRows  safety cap; the table can be longer than the UI shows
 * @returns one row per scorer, or `[]` when the section or the table is missing
 */
export function parseTopScorers(wikitext: string, maxRows = 20): ParsedScorer[] {
  const heading = SECTION_HEADING.exec(wikitext);
  if (!heading) return [];

  const tableStart = wikitext.indexOf('{|', heading.index);
  if (tableStart < 0) return [];

  const tableEnd = wikitext.indexOf('\n|}', tableStart);
  if (tableEnd < 0) return [];

  const table = wikitext.slice(tableStart, tableEnd);
  const columns = resolveColumns(parseHeaderCells(table));

  const rows = table
    .split(ROW_SEPARATOR)
    .slice(1)
    .map(parseCells)
    .filter((cells) => cells.length > 0);

  const scorers: ParsedScorer[] = [];

  for (const cells of expandRowspans(rows)) {
    if (scorers.length >= maxRows) break;
    if (cells.length <= columns.goals) continue;

    const goals = Number.parseInt(cells[columns.goals], 10);
    if (!Number.isFinite(goals)) continue;

    const player = cells[columns.player];
    const club = cells[columns.club];
    if (!player || !club) continue;

    scorers.push({ player, team: { name: club }, goals });
  }

  return scorers;
}
