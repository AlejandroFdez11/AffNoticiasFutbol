import { findTeamOption, filterTeams, getTeamLogoUrl } from '../teams';

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
