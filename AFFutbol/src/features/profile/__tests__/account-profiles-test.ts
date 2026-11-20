import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ACCOUNT_PROFILE_LIMIT,
  ACCOUNT_PROFILE_LIMIT_ERROR,
  AVATAR_COLORS,
  canCreateAccountProfile,
  describeAccountProfileError,
  hasAccountProfileFormErrors,
  mapAccountProfile,
  validateAccountProfileInput,
  type AccountProfileInput,
} from '../account-profiles';
import { DEFAULT_AVATAR_ID, PROFILE_AVATARS, getAvatar, isAvatarId } from '../avatars';

const migration = readFileSync(
  join(__dirname, '../../../../supabase/migrations/20261119000000_account_profiles.sql'),
  'utf8'
);
const avatarMigration = readFileSync(
  join(__dirname, '../../../../supabase/migrations/20261120000000_profile_avatars.sql'),
  'utf8'
);

function input(overrides: Partial<AccountProfileInput> = {}): AccountProfileInput {
  return {
    name: 'Ale',
    avatarId: DEFAULT_AVATAR_ID,
    avatarColor: 'brand',
    favoriteTeamId: null,
    favoriteTeamName: null,
    favoriteTeamLogo: null,
    ...overrides,
  };
}

describe('account profiles', () => {
  it('maps database rows to camelCase', () => {
    expect(
      mapAccountProfile({
        id: 'profile-1',
        user_id: 'user-1',
        name: 'Ale',
        avatar_id: 'shield',
        avatar_color: 'accent',
        favorite_team_id: 541,
        favorite_team_name: 'Real Madrid',
        favorite_team_logo: 'https://example.com/logo.png',
        created_at: '2026-11-19T10:00:00.000Z',
        updated_at: '2026-11-19T11:00:00.000Z',
      })
    ).toEqual({
      id: 'profile-1',
      userId: 'user-1',
      name: 'Ale',
      avatarId: 'shield',
      avatarColor: 'accent',
      favoriteTeamId: 541,
      favoriteTeamName: 'Real Madrid',
      favoriteTeamLogo: 'https://example.com/logo.png',
      createdAt: '2026-11-19T10:00:00.000Z',
      updatedAt: '2026-11-19T11:00:00.000Z',
    });
  });

  it('falls back to the default color for an unknown stored value', () => {
    const profile = mapAccountProfile({
      id: 'profile-1',
      user_id: 'user-1',
      name: 'Ale',
      avatar_id: 'unknown',
      avatar_color: 'unknown',
      favorite_team_id: null,
      favorite_team_name: null,
      favorite_team_logo: null,
      created_at: null,
      updated_at: null,
    });

    expect(profile.avatarColor).toBe('brand');
    expect(profile.avatarId).toBe(DEFAULT_AVATAR_ID);
  });

  it('mirrors the avatar ids in the SQL check constraint', () => {
    for (const avatar of PROFILE_AVATARS) {
      expect(isAvatarId(avatar.id)).toBe(true);
      expect(avatarMigration).toContain(`'${avatar.id}'`);
      expect(getAvatar(avatar.id).label).toBe(avatar.label);
    }

    expect(isAvatarId('⚽')).toBe(false);
    expect(avatarMigration).toContain('rename column avatar_emoji to avatar_id');
    expect(getAvatar('unknown').id).toBe(DEFAULT_AVATAR_ID);
  });

  it('allows at most three profiles per account and mirrors the SQL limit', () => {
    expect(ACCOUNT_PROFILE_LIMIT).toBe(3);
    expect(canCreateAccountProfile(2)).toBe(true);
    expect(canCreateAccountProfile(3)).toBe(false);
    expect(migration).toContain('>= 3');
    expect(migration).toContain(`'${ACCOUNT_PROFILE_LIMIT_ERROR}'`);
    for (const color of AVATAR_COLORS) {
      expect(migration).toContain(`'${color}'`);
    }
  });

  it('validates names and rejects duplicates inside the same account', () => {
    expect(validateAccountProfileInput(input())).toEqual({});
    expect(validateAccountProfileInput(input({ name: '   ' })).name).toContain('nombre');
    expect(validateAccountProfileInput(input({ name: 'x'.repeat(21) })).name).toContain('20');
    expect(
      validateAccountProfileInput(input({ name: ' ale ' }), ['ALE']).name
    ).toContain('Ya existe');
    expect(
      hasAccountProfileFormErrors(validateAccountProfileInput(input({ name: '' })))
    ).toBe(true);
  });

  it('explains the database errors in Spanish', () => {
    expect(describeAccountProfileError({ message: ACCOUNT_PROFILE_LIMIT_ERROR })).toContain('3 perfiles');
    expect(
      describeAccountProfileError({ code: '23505', message: 'duplicate key' })
    ).toContain('Ya existe');
    expect(describeAccountProfileError(new Error('network down'))).toContain('Inténtalo');
  });
});
