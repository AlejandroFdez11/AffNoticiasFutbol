import type { ThemeColor } from '@/constants/theme';

import { DEFAULT_AVATAR_ID, isAvatarId, type AvatarId } from './avatars';

/** Mirrors the check constraint in 20261119000000_account_profiles.sql. */
export const AVATAR_COLORS = ['brand', 'accent', 'live', 'success', 'warning', 'pitch'] as const;
export const ACCOUNT_PROFILE_LIMIT = 3;
/** Mirrors the error message raised by enforce_account_profile_limit(). */
export const ACCOUNT_PROFILE_LIMIT_ERROR = 'account_profile_limit';
export const DEFAULT_AVATAR_COLOR: AvatarColor = 'brand';

export type AvatarColor = (typeof AVATAR_COLORS)[number] & ThemeColor;

export type AccountProfile = {
  id: string;
  userId: string;
  name: string;
  avatarId: AvatarId;
  avatarColor: AvatarColor;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
  favoriteTeamLogo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccountProfileInput = {
  name: string;
  avatarId: AvatarId;
  avatarColor: AvatarColor;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
  favoriteTeamLogo: string | null;
};

export type AccountProfileRow = {
  id: string;
  user_id: string;
  name: string;
  avatar_id: string;
  avatar_color: string;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  favorite_team_logo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AccountProfileFormErrors = {
  name?: string;
};

export function mapAccountProfile(row: AccountProfileRow): AccountProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    avatarId: isAvatarId(row.avatar_id) ? row.avatar_id : DEFAULT_AVATAR_ID,
    avatarColor: isAvatarColor(row.avatar_color) ? row.avatar_color : DEFAULT_AVATAR_COLOR,
    favoriteTeamId: row.favorite_team_id,
    favoriteTeamName: row.favorite_team_name,
    favoriteTeamLogo: row.favorite_team_logo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isAvatarColor(value: string): value is AvatarColor {
  return (AVATAR_COLORS as readonly string[]).includes(value);
}

export function canCreateAccountProfile(count: number): boolean {
  return count < ACCOUNT_PROFILE_LIMIT;
}

/**
 * Names only have to be unique inside one account, like on Netflix. The
 * database enforces it too; this keeps the form from making a doomed request.
 */
export function validateAccountProfileInput(
  input: AccountProfileInput,
  otherNames: readonly string[] = []
): AccountProfileFormErrors {
  const errors: AccountProfileFormErrors = {};
  const name = input.name.trim();

  if (!name) {
    errors.name = 'Ponle un nombre al perfil.';
  } else if (name.length > 20) {
    errors.name = 'El nombre no puede superar los 20 caracteres.';
  } else if (otherNames.some((other) => other.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'Ya existe un perfil con ese nombre en esta cuenta.';
  }

  return errors;
}

export function hasAccountProfileFormErrors(errors: AccountProfileFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Maps the database contract to Spanish copy shown by the selector. */
export function describeAccountProfileError(error: unknown): string {
  const postgrest = error as { code?: string; message?: string } | null | undefined;
  const message = postgrest?.message ?? (error instanceof Error ? error.message : '');

  if (message.includes(ACCOUNT_PROFILE_LIMIT_ERROR)) {
    return `Solo puedes tener ${ACCOUNT_PROFILE_LIMIT} perfiles por cuenta.`;
  }

  if (postgrest?.code === '23505' || message.includes('account_profiles_user_name_key')) {
    return 'Ya existe un perfil con ese nombre en esta cuenta.';
  }

  return 'No se pudo guardar el perfil. Inténtalo de nuevo.';
}
