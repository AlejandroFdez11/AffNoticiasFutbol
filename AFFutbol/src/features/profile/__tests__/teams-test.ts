import {
  findTeamOption,
  filterTeams,
  getTeamLogoUrl,
  groupTeamsByLeague,
  TEAM_OPTIONS,
} from '../teams';

describe('team catalogue', () => {
  it('finds teams by id', () => {
    expect(findTeamOption(541)?.name).toBe('Real Madrid');
    expect(findTeamOption(null)).toBeNull();
    expect(findTeamOption(999999)).toBeNull();
  });

  it('filters by name, league and country', () => {
    expect(filterTeams('madrid').some((team) => team.id === 541)).toBe(true);
    expect(filterTeams('premier').every((team) => team.league === 'Premier League')).toBe(true);
    expect(filterTeams('españa').length).toBeGreaterThan(0);
    expect(filterTeams('')).toHaveLength(37);
  });

  it('builds crest URLs from the public CDN', () => {
    expect(getTeamLogoUrl(541)).toBe('https://media.api-sports.io/football/teams/541.png');
  });
});

describe('team grouping', () => {
  it('groups every club by league without losing any', () => {
    const groups = groupTeamsByLeague(TEAM_OPTIONS);

    expect(groups.length).toBeGreaterThan(5);
    expect(groups.flatMap((group) => group.teams)).toHaveLength(TEAM_OPTIONS.length);
    expect(groups[0].league).toBe('LaLiga');
    expect(groups[0].teams[0].name).toBe('Real Madrid');
    expect(groups.find((group) => group.league === 'Premier League')?.teams).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Liverpool' })])
    );
  });

  it('keeps search results grouped after filtering by league', () => {
    const groups = groupTeamsByLeague(filterTeams('Serie A'));

    expect(groups).toHaveLength(1);
    expect(groups[0].league).toBe('Serie A');
    expect(groups[0].teams.length).toBeGreaterThan(3);
  });
});
