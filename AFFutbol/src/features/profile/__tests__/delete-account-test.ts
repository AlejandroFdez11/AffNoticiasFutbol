import {
  DELETE_ACCOUNT_CONFIRMATION as SERVER_CONFIRMATION,
  parseDeletionRequest,
} from '../../../../supabase/functions/_shared/account-deletion';
import {
  DELETE_ACCOUNT_CONFIRMATION,
  describeDeleteAccountError,
  isDeleteConfirmationValid,
} from '../delete-account';

describe('delete account confirmation', () => {
  it('keeps the client and the Edge Function copies in sync', () => {
    expect(DELETE_ACCOUNT_CONFIRMATION).toBe(SERVER_CONFIRMATION);
  });

  it('accepts the word in any case and with surrounding spaces', () => {
    expect(isDeleteConfirmationValid('ELIMINAR')).toBe(true);
    expect(isDeleteConfirmationValid('eliminar')).toBe(true);
    expect(isDeleteConfirmationValid('  Eliminar  ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isDeleteConfirmationValid('')).toBe(false);
    expect(isDeleteConfirmationValid('BORRAR')).toBe(false);
    expect(isDeleteConfirmationValid('ELIMINAR TODO')).toBe(false);
  });
});

describe('parseDeletionRequest', () => {
  it('accepts the documented body', () => {
    expect(parseDeletionRequest({ confirm: 'ELIMINAR' })).toEqual({ ok: true });
    expect(parseDeletionRequest({ confirm: ' eliminar ' })).toEqual({ ok: true });
  });

  it('rejects a missing or non-string confirmation', () => {
    expect(parseDeletionRequest(null)).toEqual({ ok: false, reason: 'invalid-body' });
    expect(parseDeletionRequest('ELIMINAR')).toEqual({ ok: false, reason: 'invalid-body' });
    expect(parseDeletionRequest({})).toEqual({ ok: false, reason: 'invalid-body' });
    expect(parseDeletionRequest({ confirm: 42 })).toEqual({ ok: false, reason: 'invalid-body' });
  });

  it('rejects the wrong word', () => {
    expect(parseDeletionRequest({ confirm: 'BORRAR' })).toEqual({
      ok: false,
      reason: 'missing-confirmation',
    });
  });
});

describe('describeDeleteAccountError', () => {
  it('explains an expired session', () => {
    expect(describeDeleteAccountError({ context: { status: 401 } })).toContain('sesión');
  });

  it('points the developer at the missing function', () => {
    expect(describeDeleteAccountError({ context: { status: 404 } })).toContain('delete-account');
  });

  it('asks for a retry on server errors', () => {
    expect(describeDeleteAccountError({ context: { status: 500 } })).toContain('Vuelve a intentarlo');
  });

  it('explains an invalid confirmation', () => {
    expect(describeDeleteAccountError({ context: { status: 400 } })).toContain('ELIMINAR');
  });

  it('detects network failures', () => {
    expect(
      describeDeleteAccountError({ message: 'Failed to send a request to the Edge Function' }),
    ).toContain('conexión');
  });

  it('falls back to the generic operation message', () => {
    expect(describeDeleteAccountError({ message: 'boom' })).toBe('boom');
    expect(describeDeleteAccountError(undefined)).toContain('No se pudo completar');
  });
});
