export type ProfileFormErrors = {
  displayName?: string;
  username?: string;
};

export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

export function validateProfileForm(displayName: string, username: string): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  const name = displayName.trim();
  const handle = normalizeUsername(username);

  if (name.length > 40) {
    errors.displayName = 'El nombre no puede superar los 40 caracteres.';
  }

  if (handle && !USERNAME_PATTERN.test(handle)) {
    errors.username = 'Usa entre 3 y 20 caracteres: letras minúsculas, números, punto o guion bajo.';
  }

  return errors;
}

export function hasProfileFormErrors(errors: ProfileFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
