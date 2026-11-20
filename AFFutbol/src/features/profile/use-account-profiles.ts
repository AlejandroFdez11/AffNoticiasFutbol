import { useQuery, type QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import {
  clearActiveProfileId,
  getActiveProfileId,
  setActiveProfileId,
} from './active-profile';
import { fetchAccountProfiles } from './account-profiles-api';

export const accountProfilesKey = (userId?: string) => ['account-profiles', userId] as const;
export const activeProfileKey = (userId?: string) => ['active-profile', userId] as const;

export function useAccountProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: accountProfilesKey(user?.id),
    queryFn: fetchAccountProfiles,
    enabled: !!user,
  });
}

export function useActiveProfileId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: activeProfileKey(user?.id),
    queryFn: () => getActiveProfileId(user!.id),
    enabled: !!user,
  });
}

export function useActiveProfile() {
  const profiles = useAccountProfiles();
  const activeId = useActiveProfileId();

  const profile = profiles.data?.find((item) => item.id === activeId.data) ?? null;

  return { profile, isPending: profiles.isPending || activeId.isPending };
}

export async function chooseActiveProfile(
  client: QueryClient,
  userId: string,
  profileId: string
): Promise<void> {
  await setActiveProfileId(userId, profileId);
  client.setQueryData(activeProfileKey(userId), profileId);
}

export async function forgetActiveProfile(client: QueryClient, userId: string): Promise<void> {
  await clearActiveProfileId(userId);
  client.setQueryData(activeProfileKey(userId), null);
}
