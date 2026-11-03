import { describeAuthError, describeProfileError } from '../errors';

describe('describeAuthError', () => {
  it('maps invalid credentials', () => {
    expect(describeAuthError({ code: 'invalid_credentials' })).toBe(
      'Correo o contraseña incorrectos.'
    );
  });

  it('maps unconfirmed emails', () => {
    expect(describeAuthError({ code: 'email_not_confirmed' })).toContain('confirmado tu correo');
  });

  it('maps network failures', () => {
    expect(describeAuthError(new Error('Network request failed'))).toContain('conexión');
  });

  it('keeps unknown messages as a fallback', () => {
    expect(describeAuthError(new Error('Something odd'))).toBe('Something odd');
  });
});

describe('describeProfileError', () => {
  it('explains duplicate usernames', () => {
    expect(describeProfileError({ code: '23505' })).toBe('Ese nombre de usuario ya está en uso.');
  });

  it('explains missing migrations', () => {
    expect(describeProfileError({ code: '42P01' })).toContain('migración');
  });
});
