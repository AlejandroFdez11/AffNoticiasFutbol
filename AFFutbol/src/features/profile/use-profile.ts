// src/features/profile/use-profile.ts
import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth-provider';
import { fetchProfile } from './api';

export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}