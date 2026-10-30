/**
 * Deterministic mock data for API-Football.
 *
 * Fixture ids encode the day they belong to (`yyyyMMdd` + index) so that a
 * detail request can be resolved without keeping state. The mock set is
 * generated relative to the requested date: past days are finished, future
 * days are scheduled, and today mixes finished, live and upcoming matches.
 */

import type {
  Fixture,
  FixtureEvent,
  FixtureGoals,
  FixtureLeague,
  FixtureLineup,
  FixtureStatus,
  FixtureTeam,
  FixtureTeamStatistics,
  LineupPlayer,
} from './types';

type MockPhase = 'finished' | 'live' | 'scheduled';

type MockTemplate = {
  index: number;
  league: FixtureLeague;
  home: FixtureTeam;
  away: FixtureTeam;
  /** Local kickoff time, `HH:mm`. */
  kickoff: string;
  /** Status used when the fixture belongs to "today". */
  todayPhase: MockPhase;
  goals: FixtureGoals;
  formation: [string, string];
};

const team = (id: number, name: string): FixtureTeam => ({
  id,
  name,
  logo: `https://media.api-sports.io/football/teams/${id}.png`,
});

const league = (
  id: number,
  name: string,
  country: string,
  flag: string | null,
  round: string,
  season = 2026
): FixtureLeague => ({
  id,
  name,
  country,
  logo: `https://media.api-sports.io/football/leagues/${id}.png`,
  flag,
  season,
  round,
  standings: false,
});

export const MOCK_TEMPLATES: MockTemplate[] = [
  {
    index: 0,
    league: league(
      140,
      'LaLiga',
      'Spain',
      'https://media.api-sports.io/flags/es.svg',
      'Regular Season - 11'
    ),
    home: team(543, 'Real Betis'),
    away: team(536, 'Sevilla FC'),
    kickoff: '16:15',
    todayPhase: 'finished',
    goals: { home: 2, away: 1 },
    formation: ['4-2-3-1', '4-4-2'],
  },
  {
    index: 1,
    league: league(
      39,
      'Premier League',
      'England',
      'https://media.api-sports.io/flags/gb-eng.svg',
      'Regular Season - 10'
    ),
    home: team(42, 'Arsenal'),
    away: team(49, 'Chelsea'),
    kickoff: '18:30',
    todayPhase: 'finished',
    goals: { home: 1, away: 1 },
    formation: ['4-3-3', '3-4-3'],
  },
  {
    index: 2,
    league: league(
      135,
      'Serie A',
      'Italy',
      'https://media.api-sports.io/flags/it.svg',
      'Regular Season - 10'
    ),
    home: team(505, 'Inter'),
    away: team(489, 'AC Milan'),
    kickoff: '20:45',
    todayPhase: 'live',
    goals: { home: 1, away: 0 },
    formation: ['3-5-2', '4-2-3-1'],
  },
  {
    index: 3,
    league: league(
      78,
      'Bundesliga',
      'Germany',
      'https://media.api-sports.io/flags/de.svg',
      'Regular Season - 9'
    ),
    home: team(157, 'Bayern München'),
    away: team(165, 'Borussia Dortmund'),
    kickoff: '18:30',
    todayPhase: 'scheduled',
    goals: { home: null, away: null },
    formation: ['4-2-3-1', '4-3-3'],
  },
  {
    index: 4,
    league: league(
      140,
      'LaLiga',
      'Spain',
      'https://media.api-sports.io/flags/es.svg',
      'Regular Season - 11'
    ),
    home: team(541, 'Real Madrid'),
    away: team(529, 'FC Barcelona'),
    kickoff: '21:00',
    todayPhase: 'scheduled',
    goals: { home: null, away: null },
    formation: ['4-3-3', '4-3-3'],
  },
  {
    index: 5,
    league: league(2, 'UEFA Champions League', 'World', null, 'League Stage - 4'),
    home: team(85, 'Paris Saint Germain'),
    away: team(50, 'Manchester City'),
    kickoff: '21:00',
    todayPhase: 'scheduled',
    goals: { home: null, away: null },
    formation: ['4-3-3', '4-1-4-1'],
  },
];

const FIRST_NAMES = [
  'A.',
  'J.',
  'M.',
  'D.',
  'L.',
  'R.',
  'S.',
  'P.',
  'C.',
  'N.',
  'G.',
  'F.',
  'T.',
  'V.',
  'B.',
  'E.',
  'I.',
  'H.',
  'O.',
  'K.',
  'U.',
  'W.',
];

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Martínez',
  'Sánchez',
  'Pérez',
  'Gómez',
  'López',
  'Díaz',
  'Torres',
  'Ruiz',
  'Navarro',
  'Silva',
  'Costa',
  'Ferrari',
  'Müller',
  'Rossi',
  'Keller',
  'Bianchi',
  'Novak',
  'Petit',
  'Moreau',
  'Vega',
];

const POSITIONS = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'F', 'F', 'F'];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return toDateKey(new Date());
}

/** `yyyyMMdd` + index, e.g. `2026103002`. */
export function toMockFixtureId(dateKey: string, index: number) {
  return Number(dateKey.replace(/-/g, '')) * 100 + index;
}

export function parseMockFixtureId(id: number): { dateKey: string; index: number } | null {
  if (!Number.isInteger(id) || id < 100_000_000) return null;

  const index = id % 100;
  const rawDate = Math.floor(id / 100);
  const year = Math.floor(rawDate / 10_000);
  const month = Math.floor((rawDate % 10_000) / 100);
  const day = rawDate % 100;

  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    index >= MOCK_TEMPLATES.length
  ) {
    return null;
  }

  return {
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    index,
  };
}

function phaseFor(dateKey: string, todayPhase: MockPhase): MockPhase {
  const today = todayKey();
  if (dateKey < today) return 'finished';
  if (dateKey > today) return 'scheduled';
  return todayPhase;
}

function statusFor(phase: MockPhase): FixtureStatus {
  if (phase === 'finished') {
    return { long: 'Match Finished', short: 'FT', elapsed: 90, extra: 4 };
  }
  if (phase === 'live') {
    return { long: 'Second Half', short: '2H', elapsed: 67, extra: null };
  }
  return { long: 'Not Started', short: 'NS', elapsed: null, extra: null };
}

function goalsFor(phase: MockPhase, template: MockTemplate): FixtureGoals {
  return phase === 'scheduled' ? { home: null, away: null } : { ...template.goals };
}

function kickoffIso(dateKey: string, kickoff: string) {
  return new Date(`${dateKey}T${kickoff}:00`).toISOString();
}

export function buildMockFixture(
  template: MockTemplate,
  dateKey: string,
  phase: MockPhase
): Fixture {
  const goals = goalsFor(phase, template);
  const status = statusFor(phase);
  const kickoff = kickoffIso(dateKey, template.kickoff);
  const kickoffSeconds = Math.floor(new Date(kickoff).getTime() / 1000);

  return {
    fixture: {
      id: toMockFixtureId(dateKey, template.index),
      referee: 'M. Oliver',
      timezone: 'UTC',
      date: kickoff,
      timestamp: kickoffSeconds,
      periods: {
        first: phase === 'scheduled' ? null : kickoffSeconds,
        second: phase === 'scheduled' ? null : kickoffSeconds + 3600,
      },
      venue: {
        id: 1000 + template.index,
        name: `Estadio ${template.home.name}`,
        city: template.home.name,
      },
      status,
    },
    league: { ...template.league },
    teams: {
      home: { ...template.home, winner: winnerFor(phase, goals, 'home') },
      away: { ...template.away, winner: winnerFor(phase, goals, 'away') },
    },
    goals,
    score: {
      halftime:
        phase === 'scheduled'
          ? { home: null, away: null }
          : { home: 0, away: 0 },
      fulltime: phase === 'finished' ? { ...goals } : { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

function winnerFor(phase: MockPhase, goals: FixtureGoals, side: 'home' | 'away') {
  if (phase === 'scheduled' || goals.home === null || goals.away === null) return null;
  if (goals.home === goals.away) return null;
  const other = side === 'home' ? 'away' : 'home';
  return (goals[side] ?? 0) > (goals[other] ?? 0);
}

export function getMockFixturesByDate(dateKey: string): Fixture[] {
  return MOCK_TEMPLATES.map((template) =>
    buildMockFixture(template, dateKey, phaseFor(dateKey, template.todayPhase))
  );
}

function fixtureForId(id: number): Fixture | null {
  const parsed = parseMockFixtureId(id);
  if (!parsed) return null;

  const template = MOCK_TEMPLATES[parsed.index];
  return buildMockFixture(template, parsed.dateKey, phaseFor(parsed.dateKey, template.todayPhase));
}

export function getMockFixtureById(id: number): Fixture | null {
  return fixtureForId(id);
}

const SCORERS = [
  'A. García',
  'M. Rossi',
  'L. Moreau',
  'D. Müller',
  'J. Costa',
  'S. Novak',
];

function eventsFor(fixture: Fixture): FixtureEvent[] {
  if (fixture.fixture.status.short === 'NS') return [];

  const events: FixtureEvent[] = [];
  const homeGoals = fixture.goals.home ?? 0;
  const awayGoals = fixture.goals.away ?? 0;
  const goalMinutes = [12, 39, 58, 74, 88, 90];
  let goalIndex = 0;

  const goal = (side: 'home' | 'away', index: number) => {
    const team = fixture.teams[side];
    events.push({
      time: { elapsed: goalMinutes[index % goalMinutes.length], extra: null },
      team: { id: team.id, name: team.name, logo: team.logo },
      player: { id: 9000 + index, name: SCORERS[index % SCORERS.length] },
      assist: { id: 9100 + index, name: SCORERS[(index + 2) % SCORERS.length] },
      type: 'Goal',
      detail: 'Normal Goal',
      comments: null,
    });
  };

  for (let i = 0; i < homeGoals; i += 1) {
    goal('home', goalIndex);
    goalIndex += 1;
  }
  for (let i = 0; i < awayGoals; i += 1) {
    goal('away', goalIndex);
    goalIndex += 1;
  }

  events.push(
    {
      time: { elapsed: 34, extra: null },
      team: { id: fixture.teams.away.id, name: fixture.teams.away.name, logo: fixture.teams.away.logo },
      player: { id: 9400, name: SCORERS[2] },
      assist: { id: null, name: null },
      type: 'Card',
      detail: 'Yellow Card',
      comments: null,
    },
    {
      time: { elapsed: 55, extra: null },
      team: { id: fixture.teams.home.id, name: fixture.teams.home.name, logo: fixture.teams.home.logo },
      player: { id: 9401, name: SCORERS[4] },
      assist: { id: 9402, name: SCORERS[0] },
      type: 'subst',
      detail: 'Substitution 1',
      comments: null,
    },
    {
      time: { elapsed: 61, extra: null },
      team: { id: fixture.teams.home.id, name: fixture.teams.home.name, logo: fixture.teams.home.logo },
      player: { id: 9403, name: SCORERS[5] },
      assist: { id: null, name: null },
      type: 'Card',
      detail: 'Yellow Card',
      comments: null,
    }
  );

  return events.sort((a, b) => a.time.elapsed - b.time.elapsed);
}

export function getMockFixtureEvents(id: number): FixtureEvent[] {
  const fixture = fixtureForId(id);
  return fixture ? eventsFor(fixture) : [];
}

function buildPlayers(team: FixtureTeam, formation: string, seed: number, kind: 'XI' | 'SUB') {
  const count = kind === 'XI' ? 11 : 7;
  const rows = [1, ...formation.split('-').map(Number)];

  const grid = (index: number) => {
    let remaining = index;
    for (let row = 0; row < rows.length; row += 1) {
      if (remaining < rows[row]) return `${row + 1}:${remaining + 1}`;
      remaining -= rows[row];
    }
    return null;
  };

  return Array.from({ length: count }, (_, i): LineupPlayer => {
    const offset = seed + i;
    return {
      id: team.id * 100 + offset,
      name: `${FIRST_NAMES[offset % FIRST_NAMES.length]} ${LAST_NAMES[(offset * 3) % LAST_NAMES.length]}`,
      number: kind === 'XI' ? i + 1 : 12 + i,
      pos: kind === 'XI' ? POSITIONS[i] : POSITIONS[(i + 3) % POSITIONS.length],
      grid: kind === 'XI' ? grid(i) : null,
    };
  });
}

function lineupFor(
  team: FixtureTeam,
  seed: number,
  formation: string
): FixtureLineup {
  return {
    team: { ...team, colors: null },
    formation,
    coach: {
      id: 5000 + seed,
      name: `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed + 5) % LAST_NAMES.length]}`,
      photo: null,
    },
    startXI: buildPlayers(team, formation, seed, 'XI').map((player) => ({ player })),
    substitutes: buildPlayers(team, formation, seed + 11, 'SUB').map((player) => ({ player })),
  };
}

export function getMockFixtureLineups(id: number): FixtureLineup[] {
  const fixture = fixtureForId(id);
  const parsed = parseMockFixtureId(id);
  if (!fixture || !parsed || fixture.fixture.status.short === 'NS') return [];

  const template = MOCK_TEMPLATES[parsed.index];
  const homeSeed = template.index * 7 + 1;
  const awaySeed = template.index * 7 + 23;

  return [
    lineupFor(fixture.teams.home, homeSeed, template.formation[0]),
    lineupFor(fixture.teams.away, awaySeed, template.formation[1]),
  ];
}

export function getMockFixtureStatistics(id: number): FixtureTeamStatistics[] {
  const fixture = fixtureForId(id);
  if (!fixture || fixture.fixture.status.short === 'NS') return [];

  const homePossession = 56;
  const homeShots = (fixture.goals.home ?? 0) * 3 + 6;
  const awayShots = (fixture.goals.away ?? 0) * 3 + 4;

  const build = (side: 'home' | 'away'): FixtureTeamStatistics => {
    const possession = side === 'home' ? homePossession : 100 - homePossession;
    const shots = side === 'home' ? homeShots : awayShots;

    return {
      team: {
        id: fixture.teams[side].id,
        name: fixture.teams[side].name,
        logo: fixture.teams[side].logo,
      },
      statistics: [
        { type: 'Ball Possession', value: `${possession}%` },
        { type: 'Total Shots', value: shots },
        { type: 'Shots on Goal', value: Math.max(1, Math.round(shots / 3)) },
        { type: 'Shots off Goal', value: Math.max(1, Math.round(shots / 3)) },
        { type: 'Corner Kicks', value: side === 'home' ? 6 : 3 },
        { type: 'Fouls', value: side === 'home' ? 11 : 14 },
        { type: 'Yellow Cards', value: side === 'home' ? 1 : 2 },
        { type: 'Red Cards', value: 0 },
        { type: 'Offsides', value: side === 'home' ? 2 : 4 },
        { type: 'Goalkeeper Saves', value: side === 'home' ? 2 : 4 },
        { type: 'Total passes', value: side === 'home' ? 512 : 388 },
        { type: 'Passes accurate', value: side === 'home' ? 452 : 320 },
      ],
    };
  };

  return [build('home'), build('away')];
}
