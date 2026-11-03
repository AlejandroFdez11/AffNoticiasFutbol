export type AuthFormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
};

export const MIN_PASSWORD_LENGTH = 8;

/** Basic email check; Supabase performs the authoritative validation. */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) {
    return 'Escribe tu correo electrónico.';
  }

  if (!isValidEmail(value)) {
    return 'El correo no tiene un formato válido.';
  }

  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) {
    return 'Escribe tu contraseña.';
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (value.length > 72) {
    return 'La contraseña no puede superar los 72 caracteres.';
  }

  return undefined;
}

export function validateSignInForm(email: string, password: string): AuthFormErrors {
  return {
    email: validateEmail(email),
    password: password ? undefined : 'Escribe tu contraseña.',
  };
}

export function validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string,
  displayName: string
): AuthFormErrors {
  const errors: AuthFormErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };

  if (!confirmPassword) {
    errors.confirmPassword = 'Repite la contraseña.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  if (displayName.trim().length > 40) {
    errors.displayName = 'El nombre no puede superar los 40 caracteres.';
  }

  return errors;
}

export function hasFormErrors(errors: AuthFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
