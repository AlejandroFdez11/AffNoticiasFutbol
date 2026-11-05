/** Shared shapes for the global leaderboard and private leagues. */

export type RankingEntry = {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
  favoriteTeamLogo: string | null;
  totalPoints: number;
  predictions: number;
  settled: number;
  exactScores: number;
  isMe: boolean;
};

/** Row returned by `public.global_ranking()` / `public.league_ranking()`. */
export type RankingRow = {
  rank: number | string;
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  favorite_team_logo: string | null;
  total_points: number | string;
  predictions: number | string;
  settled: number | string;
  exact_scores: number | string;
  is_me: boolean;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapRankingEntry(row: RankingRow): RankingEntry {
  return {
    rank: toNumber(row.rank),
    userId: row.user_id,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url,
    favoriteTeamId: row.favorite_team_id,
    favoriteTeamName: row.favorite_team_name,
    favoriteTeamLogo: row.favorite_team_logo,
    totalPoints: toNumber(row.total_points),
    predictions: toNumber(row.predictions),
    settled: toNumber(row.settled),
    exactScores: toNumber(row.exact_scores),
    isMe: Boolean(row.is_me),
  };
}

export type LeagueRole = 'owner' | 'member';

export type League = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  role: LeagueRole;
  memberCount: number;
  joinedAt: string | null;
  createdAt: string | null;
};

/** Row returned by `public.my_leagues()` and the league RPCs. */
export type LeagueRow = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  role: string;
  member_count: number | string;
  joined_at: string | null;
  created_at: string | null;
};

export function mapLeague(row: LeagueRow): League {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    role: row.role === 'owner' ? 'owner' : 'member',
    memberCount: toNumber(row.member_count),
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  };
}

/** `AF` for "Alejandro Fernández", the same rule as the profile avatar. */
export function getRankingInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'AF';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}
