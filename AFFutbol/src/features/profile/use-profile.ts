// src/features/profile/use-profile.ts
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';
import { fetchProfile } from './api';

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!),
    enabled: !!user,
  });
}
