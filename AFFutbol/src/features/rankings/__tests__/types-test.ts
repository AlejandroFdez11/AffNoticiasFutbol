import {
  getRankingInitials,
  mapLeague,
  mapRankingEntry,
  type LeagueRow,
  type RankingRow,
} from '../types';

const rankingRow: RankingRow = {
  rank: '2',
  user_id: 'user-2',
  display_name: 'Alejandro Fernández',
  username: 'ale',
  avatar_url: null,
  favorite_team_id: 541,
  favorite_team_name: 'Real Madrid',
  favorite_team_logo: null,
  total_points: '25',
  predictions: 4,
  settled: '3',
  exact_scores: 2,
  is_me: true,
};

describe('mapRankingEntry', () => {
  it('converts bigint strings and camelCases the row', () => {
    expect(mapRankingEntry(rankingRow)).toEqual({
      rank: 2,
      userId: 'user-2',
      displayName: 'Alejandro Fernández',
      username: 'ale',
      avatarUrl: null,
      favoriteTeamId: 541,
      favoriteTeamName: 'Real Madrid',
      favoriteTeamLogo: null,
      totalPoints: 25,
      predictions: 4,
      settled: 3,
      exactScores: 2,
      isMe: true,
    });
  });

  it('falls back to zero for invalid counters', () => {
    const entry = mapRankingEntry({
      ...rankingRow,
      total_points: 'not-a-number',
      predictions: '',
    });

    expect(entry.totalPoints).toBe(0);
    expect(entry.predictions).toBe(0);
  });
});

const leagueRow: LeagueRow = {
  id: 'league-1',
  name: 'Los del curro',
  invite_code: 'ABC123',
  owner_id: 'user-1',
  role: 'owner',
  member_count: '4',
  joined_at: '2026-11-05T10:00:00.000Z',
  created_at: '2026-11-05T10:00:00.000Z',
};

describe('mapLeague', () => {
  it('maps an owner league row', () => {
    expect(mapLeague(leagueRow)).toEqual({
      id: 'league-1',
      name: 'Los del curro',
      inviteCode: 'ABC123',
      ownerId: 'user-1',
      role: 'owner',
      memberCount: 4,
      joinedAt: '2026-11-05T10:00:00.000Z',
      createdAt: '2026-11-05T10:00:00.000Z',
    });
  });

  it('treats unknown roles as members', () => {
    expect(mapLeague({ ...leagueRow, role: 'admin' }).role).toBe('member');
  });
});

describe('getRankingInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getRankingInitials('Alejandro Fernández Franco')).toBe('AF');
    expect(getRankingInitials('  ')).toBe('AF');
  });
});
