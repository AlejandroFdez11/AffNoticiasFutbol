import type { User } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import type { AuthProvider, Profile } from './types';

export function getAuthProvider(user: User | null): AuthProvider {
  const provider = user?.app_metadata?.provider;

  if (provider === 'google' || provider === 'apple') {
    return provider;
  }

  return 'email';
}

export function getProviderLabel(provider: AuthProvider): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    default:
      return 'Correo';
  }
}

export function getProfileDisplayName(profile: Profile | null, user: User | null): string {
  if (profile?.displayName) {
    return profile.displayName;
  }

  if (profile?.username) {
    return profile.username;
  }

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataName = [metadata.full_name, metadata.name, metadata.display_name].find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );

  if (metadataName) {
    return metadataName;
  }

  return user?.email?.split('@')[0] || 'Aficionado';
}

/** Example: `Miembro desde octubre de 2026`. */
export function formatMemberSince(isoDate: string | null): string | null {
  if (!isoDate) {
    return null;
  }

  try {
    return `Miembro desde ${format(parseISO(isoDate), "MMMM 'de' yyyy", { locale: es })}`;
  } catch {
    return null;
  }
}
