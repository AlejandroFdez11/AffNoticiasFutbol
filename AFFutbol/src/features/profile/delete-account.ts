/**
 * Account deletion (App Store Review Guideline 5.1.1(v)).
 *
 * The UI asks the user to type `ELIMINAR` before the final button unlocks. The
 * server repeats the check against `{ confirm }` in the request body, so the
 * confirmation is a real safety rail and not only a client-side detail. The
 * word is mirrored in `supabase/functions/_shared/account-deletion.ts`; the Jest
 * test keeps both copies in sync.
 *
 * Pure module: no Supabase client, so it runs under Jest. The network call is
 * `deleteAccount()` in `api.ts`.
 */

import { describeAuthError } from '@/features/auth/errors';

export const DELETE_ACCOUNT_CONFIRMATION = 'ELIMINAR';

/** Case and surrounding spaces do not matter; the word itself does. */
export function isDeleteConfirmationValid(value: string): boolean {
  return value.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION;
}

type FunctionsErrorShape = {
  name?: string;
  message?: string;
  context?: { status?: number };
};

/**
 * Maps `supabase.functions.invoke()` failures to copy the user can act on.
 *
 * `FunctionsHttpError` keeps the HTTP response in `context`; a missing function
 * answers 404, an expired session 401. Network failures come as
 * `FunctionsFetchError` ("Failed to send a request to the Edge Function") and
 * have no status at all.
 */
export function describeDeleteAccountError(error: unknown): string {
  const value: FunctionsErrorShape =
    typeof error === 'object' && error !== null ? (error as FunctionsErrorShape) : {};
  const status = value.context?.status;
  const normalized = value.message?.toLowerCase() ?? '';

  if (status === 401) {
    return 'Tu sesión ha caducado. Vuelve a iniciar sesión y repite la operación.';
  }

  if (status === 404) {
    return 'El servidor de bajas no está disponible. Si eres el desarrollador, despliega la función delete-account.';
  }

  if (typeof status === 'number' && status >= 500) {
    return 'El servidor no pudo eliminar la cuenta. Vuelve a intentarlo en unos minutos.';
  }

  if (status === 400) {
    return 'La confirmación no es válida. Escribe ELIMINAR para continuar.';
  }

  if (
    normalized.includes('failed to send a request') ||
    normalized.includes('network request failed') ||
    normalized.includes('failed to fetch')
  ) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  return describeAuthError(error);
}
