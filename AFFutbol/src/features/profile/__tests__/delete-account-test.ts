import {
  DELETE_ACCOUNT_CONFIRMATION as SERVER_CONFIRMATION,
  parseDeletionRequest,
} from '../../../../supabase/functions/_shared/account-deletion';
import {
  DELETE_ACCOUNT_CONFIRMATION,
  describeDeleteAccountError,
  isDeleteConfirmationValid,
} from '../delete-account';

describe('account deletion confirmation', () => {
  it('keeps the client and server phrases in sync', () => {
    expect(DELETE_ACCOUNT_CONFIRMATION).toBe(SERVER_CONFIRMATION);
  });

  it('accepts the word in any case and with surrounding spaces', () => {
    expect(isDeleteConfirmationValid('ELIMINAR')).toBe(true);
    expect(isDeleteConfirmationValid(' eliminar ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isDeleteConfirmationValid('')).toBe(false);
    expect(isDeleteConfirmationValid('eliminar cuenta')).toBe(false);
    expect(isDeleteConfirmationValid('BORRAR')).toBe(false);
  });
});

describe('parseDeletionRequest', () => {
  it('accepts a confirmed body', () => {
    expect(parseDeletionRequest({ confirm: 'Eliminar' })).toEqual({ ok: true });
  });

  it('rejects a body without the confirmation word', () => {
    expect(parseDeletionRequest({})).toEqual({ ok: false, reason: 'invalid-body' });
    expect(parseDeletionRequest({ confirm: 'si' })).toEqual({
      ok: false,
      reason: 'missing-confirmation',
    });
    expect(parseDeletionRequest(null)).toEqual({ ok: false, reason: 'invalid-body' });
  });
});

describe('describeDeleteAccountError', () => {
  it('explains an expired session', () => {
    expect(describeDeleteAccountError({ context: { status: 401 } })).toContain('sesión');
  });

  it('points to the deploy step when the function is missing', () => {
    expect(describeDeleteAccountError({ context: { status: 404 } })).toContain('delete-account');
  });

  it('maps network failures', () => {
    expect(
      describeDeleteAccountError({
        name: 'FunctionsFetchError',
        message: 'Failed to send a request to the Edge Function',
      })
    ).toContain('conexión');
  });

  it('falls back to the auth copy', () => {
    expect(describeDeleteAccountError(new Error('boom'))).toBe('boom');
  });
});
