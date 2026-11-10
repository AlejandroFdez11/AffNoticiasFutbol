/**
 * Pure helpers for `delete-account`.
 *
 * Kept out of `index.ts` on purpose: the function file imports Deno globals and
 * the service-role client, neither of which exists under Jest. This module is
 * plain TypeScript, so `src/features/profile/__tests__/delete-account-test.ts`
 * can type-check and test it directly.
 */

/**
 * Word the client has to send back before the account is deleted. It guards
 * against a stray request with a valid session (and forces the UI to show an
 * explicit confirmation step). Mirrored in `src/features/profile/delete-account.ts`;
 * the Jest test keeps both copies in sync.
 */
export const DELETE_ACCOUNT_CONFIRMATION = 'ELIMINAR';

export type DeletionRequestResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-body' | 'missing-confirmation' };

/**
 * Reads `{ "confirm": "ELIMINAR" }` from the parsed JSON body.
 *
 * Accepts the word in any case and with surrounding spaces: the confirmation is
 * a safety rail, not a password. Anything else is rejected with a 400.
 */
export function parseDeletionRequest(body: unknown): DeletionRequestResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, reason: 'invalid-body' };
  }

  const confirm = (body as { confirm?: unknown }).confirm;

  if (typeof confirm !== 'string') {
    return { ok: false, reason: 'invalid-body' };
  }

  if (confirm.trim().toUpperCase() !== DELETE_ACCOUNT_CONFIRMATION) {
    return { ok: false, reason: 'missing-confirmation' };
  }

  return { ok: true };
}
