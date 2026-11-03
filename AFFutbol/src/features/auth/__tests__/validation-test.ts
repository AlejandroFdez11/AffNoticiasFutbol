import {
  hasFormErrors,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateSignInForm,
  validateSignUpForm,
} from '../validation';

describe('auth validation', () => {
  it('normalizes emails', () => {
    expect(normalizeEmail('  Fan@Example.COM ')).toBe('fan@example.com');
  });

  it('validates emails', () => {
    expect(validateEmail('fan@example.com')).toBeUndefined();
    expect(validateEmail('fan@example')).toBe('El correo no tiene un formato válido.');
    expect(validateEmail('')).toBe('Escribe tu correo electrónico.');
  });

  it('requires at least 8 password characters', () => {
    expect(validatePassword('1234567')).toBe('La contraseña debe tener al menos 8 caracteres.');
    expect(validatePassword('12345678')).toBeUndefined();
  });

  it('only requires an existing password to sign in', () => {
    expect(validateSignInForm('fan@example.com', '')).toEqual({
      email: undefined,
      password: 'Escribe tu contraseña.',
    });
  });

  it('checks the confirmation when signing up', () => {
    const errors = validateSignUpForm('fan@example.com', '12345678', '12345679', '');

    expect(errors.confirmPassword).toBe('Las contraseñas no coinciden.');
    expect(hasFormErrors(errors)).toBe(true);
  });

  it('accepts a valid sign-up form', () => {
    const errors = validateSignUpForm('fan@example.com', '12345678', '12345678', 'Ale');

    expect(hasFormErrors(errors)).toBe(false);
  });
});
