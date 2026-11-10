import type { User } from '@supabase/supabase-js';

import { requireSupabase } from '@/features/auth/supabase';

import { DELETE_ACCOUNT_CONFIRMATION } from './delete-account';
import { mapProfile, type Profile, type ProfilePatch, type ProfileRow } from './types';

type UserMetadata = Record<string, unknown>;

function readMetadataString(metadata: UserMetadata, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Best-effort name for new profiles created from OAuth or email sign-up. */
export function defaultDisplayName(user: User): string {
  const metadata = (user.user_metadata ?? {}) as UserMetadata;
  const name =
    readMetadataString(metadata, 'display_name') ??
    readMetadataString(metadata, 'full_name') ??
    readMetadataString(metadata, 'name') ??
    readMetadataString(metadata, 'user_name');

  if (name) {
    return name;
  }

  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'Aficionado';
}

export function defaultAvatarUrl(user: User): string | null {
  const metadata = (user.user_metadata ?? {}) as UserMetadata;
  return readMetadataString(metadata, 'avatar_url') ?? readMetadataString(metadata, 'picture');
}

/**
 * Returns the profile row for a user, creating it on first access. The SQL
 * migration also creates it from a trigger; this keeps OAuth users and
 * pre-existing accounts working if the trigger was added later.
 */
export async function fetchProfile(user: User): Promise<Profile> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  if (data) {
    return mapProfile(data);
  }

  const { error: upsertError } = await client.from('profiles').upsert(
    {
      id: user.id,
      display_name: defaultDisplayName(user),
      avatar_url: defaultAvatarUrl(user),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  if (upsertError) {
    throw upsertError;
  }

  const { data: created, error: createdError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (createdError) {
    throw createdError;
  }

  return mapProfile(created);
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  const client = requireSupabase();
  const payload: Partial<ProfileRow> = {};

  if (patch.displayName !== undefined) {
    payload.display_name = patch.displayName?.trim() || null;
  }

  if (patch.username !== undefined) {
    payload.username = patch.username?.trim().toLowerCase() || null;
  }

  if (patch.favoriteTeamId !== undefined) {
    payload.favorite_team_id = patch.favoriteTeamId;
  }

  if (patch.favoriteTeamName !== undefined) {
    payload.favorite_team_name = patch.favoriteTeamName;
  }

  if (patch.favoriteTeamLogo !== undefined) {
    payload.favorite_team_logo = patch.favoriteTeamLogo;
  }

  const { data, error } = await client
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

/**
 * Permanently deletes the signed-in account.
 *
 * The Edge Function `delete-account` verifies the JWT, deletes the row from
 * `auth.users` with the service role and lets the `on delete cascade` foreign
 * keys remove the profile, predictions, leagues, push tokens and preferences.
 * The client never holds the service-role key.
 */
export async function deleteAccount(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.functions.invoke('delete-account', {
    body: { confirm: DELETE_ACCOUNT_CONFIRMATION },
  });

  if (error) {
    throw error;
  }
}
