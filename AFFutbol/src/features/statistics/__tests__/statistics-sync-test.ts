import {
  buildCrestLookup,
  currentSeason,
  formatSeason,
  mapStandings,
  mergeSnapshot,
  normalizeClubName,
  parseForm,
  type FootballDataStandingsResponse,
  type LeagueInfo,
  type StandingRow,
  type StoredLeagueSnapshot,
} from '../../../../supabase/functions/_shared/statistics';

const RESPONSE: FootballDataStandingsResponse = {
  season: { startDate: '2026-08-15', endDate: '2027-05-24' },
  standings: [
    {
      stage: 'REGULAR_SEASON',
      type: 'TOTAL',
      group: null,
      table: [
        {
          position: 1,
          team: {
            id: 86,
            name: 'Real Madrid CF',
            shortName: 'Real Madrid',
            crest: 'https://crests.football-data.org/86.png',
          },
          playedGames: 12,
          form: 'W,W,D,L,W',
          won: 9,
          draw: 2,
          lost: 1,
          points: 29,
          goalsFor: 25,
          goalsAgainst: 10,
          goalDifference: 15,
        },
        {
          position: 2,
          team: {
            id: 81,
            name: 'FC Barcelona',
            shortName: 'Barça',
            crest: 'https://crests.football-data.org/81.png',
          },
          playedGames: 12,
          form: 'W,L,W,W,W',
          won: 9,
          draw: 0,
          lost: 3,
          points: 27,
          goalsFor: 30,
          goalsAgainst: 14,
          goalDifference: 16,
        },
        {
          position: 3,
          team: {
            id: 78,
            name: 'Club Atlético de Madrid',
            shortName: 'Atleti',
            crest: null,
          },
          playedGames: 12,
          form: null,
          won: 7,
          draw: 3,
          lost: 2,
          points: 24,
          goalsFor: 20,
          goalsAgainst: 11,
          goalDifference: 9,
        },
      ],
    },
    {
      stage: 'REGULAR_SEASON',
      type: 'HOME',
      group: null,
      table: [
        {
          position: 1,
          team: { id: 86, name: 'Real Madrid CF', crest: null },
          playedGames: 6,
          form: '',
          won: 5,
          draw: 1,
          lost: 0,
          points: 16,
          goalsFor: 14,
          goalsAgainst: 4,
        },
      ],
    },
  ],
};

const LEAGUE: LeagueInfo = {
  id: 'laliga',
  name: 'LaLiga',
  shortName: 'LaLiga',
  country: 'España',
  logo: 'https://media.api-sports.io/football/leagues/140.png',
  season: '2026/27',
};

function standing(name: string, logo?: string): StandingRow {
  return {
    team: logo ? { name, logo } : { name },
    played: 10,
    won: 6,
    drawn: 2,
    lost: 2,
    goalsFor: 18,
    goalsAgainst: 9,
    points: 20,
    form: ['W', 'D', 'W', 'L', 'W'],
  };
}

describe('football-data.org standings', () => {
  it('maps the TOTAL table and ignores HOME/AWAY', () => {
    const rows = mapStandings(RESPONSE);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      team: {
        name: 'Real Madrid CF',
        shortName: 'Real Madrid',
        logo: 'https://crests.football-data.org/86.png',
      },
      played: 12,
      won: 9,
      drawn: 2,
      lost: 1,
      goalsFor: 25,
      goalsAgainst: 10,
      points: 29,
      form: ['W', 'W', 'D', 'L', 'W'],
    });
  });

  it('drops a missing crest and an empty form', () => {
    const atleti = mapStandings(RESPONSE)[2];

    expect(atleti.team).toEqual({
      name: 'Club Atlético de Madrid',
      shortName: 'Atleti',
      logo: undefined,
    });
    expect(atleti.form).toEqual([]);
  });

  it('keeps matching the full name even when a short name is present', () => {
    const lookup = buildCrestLookup(mapStandings(RESPONSE));

    expect(lookup('Barcelona')).toBe('https://crests.football-data.org/81.png');
    expect(lookup('Barça')).toBeUndefined();
  });

  it('returns an empty table when the response has no standings', () => {
    expect(mapStandings({})).toEqual([]);
    expect(mapStandings({ standings: [] })).toEqual([]);
  });
});

describe('parseForm', () => {
  it('keeps the oldest-first order and the last five results', () => {
    expect(parseForm('W,D,L')).toEqual(['W', 'D', 'L']);
    expect(parseForm('L,L,W,D,W,W')).toEqual(['L', 'W', 'D', 'W', 'W']);
  });

  it('ignores unknown values and empty strings', () => {
    expect(parseForm('W,X,D')).toEqual(['W', 'D']);
    expect(parseForm('')).toEqual([]);
    expect(parseForm(null)).toEqual([]);
  });
});

describe('season helpers', () => {
  it('formats the API season as the label the app shows', () => {
    expect(formatSeason({ startDate: '2026-08-15', endDate: '2027-05-24' })).toBe('2026/27');
    expect(formatSeason({ startDate: '2026-08-15' })).toBeNull();
    expect(formatSeason(null)).toBeNull();
  });

  it('derives the current season from a date', () => {
    expect(currentSeason(new Date('2026-11-10T12:00:00Z'))).toBe('2026/27');
    expect(currentSeason(new Date('2027-03-01T12:00:00Z'))).toBe('2026/27');
    expect(currentSeason(new Date('2027-07-01T12:00:00Z'))).toBe('2027/28');
  });
});

describe('club name matching', () => {
  const standings = [
    standing('Real Madrid CF', 'madrid'),
    standing('FC Barcelona', 'barcelona'),
    standing('RCD Espanyol de Barcelona', 'espanyol'),
    standing('Real Racing Club de Santander', 'racing'),
    standing('RC Deportivo de La Coruña', 'deportivo'),
    standing('FC Bayern München', 'bayern'),
    standing('Levante UD'),
  ];

  it('normalizes suffixes, accents and ampersands', () => {
    expect(normalizeClubName('FC Barcelona')).toBe('barcelona');
    expect(normalizeClubName('Málaga CF')).toBe('malaga');
    expect(normalizeClubName('Brighton & Hove Albion')).toBe('brighton and hove albion');
    expect(normalizeClubName('1. FC Köln')).toBe('koln');
  });

  it('matches the short Wikipedia names against the full API names', () => {
    const lookup = buildCrestLookup(standings);

    expect(lookup('Barcelona')).toBe('barcelona');
    expect(lookup('Real Madrid')).toBe('madrid');
    expect(lookup('Espanyol')).toBe('espanyol');
    expect(lookup('Racing Santander')).toBe('racing');
    expect(lookup('Deportivo A Coruña')).toBe('deportivo');
    expect(lookup('Bayern Munich')).toBe('bayern');
  });

  it('returns nothing for an unknown club or a team without a crest', () => {
    const lookup = buildCrestLookup(standings);

    expect(lookup('Inter')).toBeUndefined();
    expect(lookup('Levante')).toBeUndefined();
    expect(lookup('')).toBeUndefined();
  });
});

describe('mergeSnapshot', () => {
  const previous: StoredLeagueSnapshot = {
    league: { ...LEAGUE, season: '2025/26' },
    standings: [standing('Real Madrid CF', 'madrid')],
    scorers: [{ player: 'Old Scorer', team: { name: 'Real Madrid CF', logo: 'madrid' }, goals: 3 }],
  };

  it('resolves crests on the fresh scorers', () => {
    const snapshot = mergeSnapshot(null, {
      league: LEAGUE,
      standings: mapStandings(RESPONSE),
      scorers: [
        { player: 'Raphinha', team: { name: 'Barcelona' }, goals: 15 },
        { player: 'Yassir Zabiri', team: { name: 'Racing Santander' }, goals: 9 },
      ],
    });

    expect(snapshot.standings).toHaveLength(3);
    expect(snapshot.scorers).toEqual([
      {
        player: 'Raphinha',
        team: { name: 'Barcelona', logo: 'https://crests.football-data.org/81.png' },
        goals: 15,
      },
      { player: 'Yassir Zabiri', team: { name: 'Racing Santander' }, goals: 9 },
    ]);
  });

  it('keeps the previous scorers when Wikipedia returns nothing', () => {
    const snapshot = mergeSnapshot(previous, {
      league: LEAGUE,
      standings: mapStandings(RESPONSE),
      scorers: [],
    });

    expect(snapshot.scorers).toEqual(previous.scorers);
    expect(snapshot.standings).toHaveLength(3);
  });

  it('keeps the previous table when football-data.org returns nothing', () => {
    const snapshot = mergeSnapshot(previous, {
      league: LEAGUE,
      standings: [],
      scorers: [{ player: 'Raphinha', team: { name: 'Real Madrid' }, goals: 15 }],
    });

    expect(snapshot.standings).toEqual(previous.standings);
    expect(snapshot.scorers[0].team.logo).toBe('madrid');
  });

  it('starts empty when there is no previous snapshot', () => {
    expect(mergeSnapshot(null, { league: LEAGUE, standings: [], scorers: [] })).toEqual({
      league: LEAGUE,
      standings: [],
      scorers: [],
    });
  });
});
