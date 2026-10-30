import { addDays, subDays } from 'date-fns';

import { toDateKey } from '@/lib/format';

import {
  getMockFixtureById,
  getMockFixtureEvents,
  getMockFixtureLineups,
  getMockFixtureStatistics,
  getMockFixturesByDate,
  parseMockFixtureId,
  toMockFixtureId,
} from '../mocks-data';

const today = new Date();
const todayKey = toDateKey(today);
const pastKey = toDateKey(subDays(today, 1));
const futureKey = toDateKey(addDays(today, 1));

describe('mock fixture ids', () => {
  it('encodes the date and the index', () => {
    expect(toMockFixtureId('2026-10-30', 2)).toBe(2026103002);
    expect(parseMockFixtureId(2026103002)).toEqual({ dateKey: '2026-10-30', index: 2 });
  });

  it('rejects invalid ids', () => {
    expect(parseMockFixtureId(123)).toBeNull();
    expect(parseMockFixtureId(2026133200)).toBeNull();
    expect(parseMockFixtureId(toMockFixtureId('2026-10-30', 99))).toBeNull();
  });
});

describe('mock fixtures by date', () => {
  it('mixes finished, live and scheduled matches today', () => {
    const fixtures = getMockFixturesByDate(todayKey);
    const statuses = fixtures.map((fixture) => fixture.fixture.status.short);

    expect(fixtures.length).toBeGreaterThanOrEqual(5);
    expect(statuses).toContain('FT');
    expect(statuses).toContain('2H');
    expect(statuses).toContain('NS');
    expect(fixtures.every((fixture) => fixture.league.logo.length > 0)).toBe(true);
  });

  it('marks past days as finished and future days as scheduled', () => {
    expect(
      getMockFixturesByDate(pastKey).every((fixture) => fixture.fixture.status.short === 'FT')
    ).toBe(true);
    expect(
      getMockFixturesByDate(futureKey).every((fixture) => fixture.fixture.status.short === 'NS')
    ).toBe(true);
  });

  it('round-trips a fixture through its id', () => {
    const fixture = getMockFixtureById(toMockFixtureId(todayKey, 2));

    expect(fixture?.fixture.id).toBe(toMockFixtureId(todayKey, 2));
    expect(fixture?.teams.home.name).toBe('Inter');
    expect(fixture?.teams.away.name).toBe('AC Milan');
  });

  it('returns null for unknown fixture ids', () => {
    expect(getMockFixtureById(999_999_999)).toBeNull();
  });
});

describe('mock match detail', () => {
  it('builds events in chronological order', () => {
    const id = toMockFixtureId(todayKey, 0);
    const events = getMockFixtureEvents(id);

    expect(events.length).toBeGreaterThan(0);
    expect(events.filter((event) => event.type === 'Goal')).toHaveLength(3);
    expect(events.map((event) => event.time.elapsed)).toEqual(
      [...events.map((event) => event.time.elapsed)].sort((a, b) => a - b)
    );
  });

  it('exposes lineups and statistics only once the match has started', () => {
    const liveId = toMockFixtureId(todayKey, 2);
    const scheduledId = toMockFixtureId(futureKey, 3);

    const lineups = getMockFixtureLineups(liveId);
    const statistics = getMockFixtureStatistics(liveId);

    expect(lineups).toHaveLength(2);
    expect(lineups[0].startXI).toHaveLength(11);
    expect(lineups[0].substitutes).toHaveLength(7);
    expect(statistics).toHaveLength(2);
    expect(statistics[0].statistics[0]).toMatchObject({ type: 'Ball Possession' });

    expect(getMockFixtureLineups(scheduledId)).toEqual([]);
    expect(getMockFixtureStatistics(scheduledId)).toEqual([]);
    expect(getMockFixtureEvents(scheduledId)).toEqual([]);
  });
});
