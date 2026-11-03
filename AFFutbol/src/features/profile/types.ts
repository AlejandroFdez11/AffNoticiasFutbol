export type AuthProvider = 'email' | 'google' | 'apple';

export type Profile = {
  id: string;
  displayName: string | null;
  username: string | null;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
  favoriteTeamLogo: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProfilePatch = {
  displayName?: string | null;
  username?: string | null;
  favoriteTeamId?: number | null;
  favoriteTeamName?: string | null;
  favoriteTeamLogo?: string | null;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  favorite_team_logo: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    favoriteTeamId: row.favorite_team_id,
    favoriteTeamName: row.favorite_team_name,
    favoriteTeamLogo: row.favorite_team_logo,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getProfileInitials(profile: Profile | null, fallback: string): string {
  const source = profile?.displayName || profile?.username || fallback;
  const parts = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'AF';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}
