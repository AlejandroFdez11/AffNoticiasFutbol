import type { User } from '@supabase/supabase-js';

import { formatMemberSince, getAuthProvider, getProfileDisplayName, getProviderLabel } from '../format';
import { getProfileInitials, mapProfile } from '../types';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-10-01T10:00:00.000Z',
    email: 'fan@example.com',
    ...overrides,
  } as User;
}

describe('profile formatting', () => {
  it('maps database rows to camelCase', () => {
    expect(
      mapProfile({
        id: 'user-1',
        display_name: 'Ale',
        username: 'ale',
        favorite_team_id: 541,
        favorite_team_name: 'Real Madrid',
        favorite_team_logo: 'https://example.com/logo.png',
        avatar_url: null,
        created_at: '2026-10-01T10:00:00.000Z',
        updated_at: '2026-10-02T10:00:00.000Z',
      })
    ).toEqual({
      id: 'user-1',
      displayName: 'Ale',
      username: 'ale',
      favoriteTeamId: 541,
      favoriteTeamName: 'Real Madrid',
      favoriteTeamLogo: 'https://example.com/logo.png',
      avatarUrl: null,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    });
  });

  it('builds initials from the display name', () => {
    const profile = mapProfile({
      id: 'user-1',
      display_name: 'Alejandro Fernández',
      username: null,
      favorite_team_id: null,
      favorite_team_name: null,
      favorite_team_logo: null,
      avatar_url: null,
      created_at: null,
      updated_at: null,
    });

    expect(getProfileInitials(profile, 'fan')).toBe('AF');
  });

  it('falls back to metadata and email for the display name', () => {
    const user = createUser({ user_metadata: { full_name: 'Ale Fan' } });

    expect(getProfileDisplayName(null, user)).toBe('Ale Fan');
    expect(getProfileDisplayName(null, createUser())).toBe('fan');
  });

  it('detects OAuth providers', () => {
    expect(getAuthProvider(createUser({ app_metadata: { provider: 'google' } }))).toBe('google');
    expect(getAuthProvider(createUser({ app_metadata: { provider: 'apple' } }))).toBe('apple');
    expect(getAuthProvider(createUser())).toBe('email');
    expect(getProviderLabel('apple')).toBe('Apple');
  });

  it('formats the member since date in Spanish', () => {
    expect(formatMemberSince('2026-10-01T10:00:00.000Z')).toBe(
      'Miembro desde octubre de 2026'
    );
    expect(formatMemberSince(null)).toBeNull();
  });
});
