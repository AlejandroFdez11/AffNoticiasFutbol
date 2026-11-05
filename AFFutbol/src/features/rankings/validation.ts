/**
 * Client-side validation for private leagues.
 *
 * The database repeats these rules (see `create_league`/`join_league`), so a
 * stale client can never store an invalid name or code.
 */

export const LEAGUE_NAME_MIN_LENGTH = 3;
export const LEAGUE_NAME_MAX_LENGTH = 40;
export const INVITE_CODE_LENGTH = 6;

/** Collapses whitespace and trims, without changing the user's casing. */
export function normalizeLeagueName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function validateLeagueName(value: string): string | null {
  const name = normalizeLeagueName(value);

  if (name.length < LEAGUE_NAME_MIN_LENGTH) {
    return `El nombre debe tener al menos ${LEAGUE_NAME_MIN_LENGTH} caracteres.`;
  }

  if (name.length > LEAGUE_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${LEAGUE_NAME_MAX_LENGTH} caracteres.`;
  }

  return null;
}

/** Uppercases and drops anything that is not a letter or digit. */
export function normalizeInviteCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH);
}

export function validateInviteCode(value: string): string | null {
  const code = normalizeInviteCode(value);

  if (code.length !== INVITE_CODE_LENGTH) {
    return `El código de invitación tiene ${INVITE_CODE_LENGTH} caracteres.`;
  }

  return null;
}
