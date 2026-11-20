import { requireSupabase } from '@/features/auth/supabase';

import {
  mapAccountProfile,
  type AccountProfile,
  type AccountProfileInput,
  type AccountProfileRow,
} from './account-profiles';

/** RLS restricts this table to the signed-in user's own rows. */
export async function fetchAccountProfiles(): Promise<AccountProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('account_profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<AccountProfileRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAccountProfile);
}

export async function createAccountProfile(input: AccountProfileInput): Promise<AccountProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('account_profiles')
    .insert({
      name: input.name.trim(),
      avatar_id: input.avatarId,
      avatar_color: input.avatarColor,
      favorite_team_id: input.favoriteTeamId,
      favorite_team_name: input.favoriteTeamName,
      favorite_team_logo: input.favoriteTeamLogo,
    })
    .select('*')
    .single<AccountProfileRow>();

  if (error) {
    throw error;
  }

  return mapAccountProfile(data);
}

export async function updateAccountProfile(
  id: string,
  input: AccountProfileInput
): Promise<AccountProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('account_profiles')
    .update({
      name: input.name.trim(),
      avatar_id: input.avatarId,
      avatar_color: input.avatarColor,
      favorite_team_id: input.favoriteTeamId,
      favorite_team_name: input.favoriteTeamName,
      favorite_team_logo: input.favoriteTeamLogo,
    })
    .eq('id', id)
    .select('*')
    .single<AccountProfileRow>();

  if (error) {
    throw error;
  }

  return mapAccountProfile(data);
}

export async function deleteAccountProfile(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('account_profiles').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
