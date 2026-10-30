import {
  getFixtureById,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
  getFixturesByDate,
} from '../fixtures';

jest.mock('@/lib/env', () => ({
  env: {
    apiFootballKey: 'test-key',
    apiFootballBaseUrl: 'https://api.test',
    useMocks: false,
  },
}));

jest.mock('@/lib/timezone', () => ({
  getDeviceTimeZone: () => undefined,
}));

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ errors: [], response: [] }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

function requestedUrl() {
  return fetchSpy.mock.calls[0][0];
}

describe('API-Football endpoints', () => {
  it('asks for the fixtures of a date', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ errors: [], response: [{ fixture: { id: 1 } }] }));

    const fixtures = await getFixturesByDate('2026-10-30');

    expect(requestedUrl()).toBe('https://api.test/fixtures?date=2026-10-30');
    expect(fixtures).toEqual([{ fixture: { id: 1 } }]);
  });

  it('returns null when a fixture id does not exist', async () => {
    await expect(getFixtureById(999)).resolves.toBeNull();
    expect(requestedUrl()).toBe('https://api.test/fixtures?id=999');
  });

  it('returns the first fixture for a known id', async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({ errors: [], response: [{ fixture: { id: 42 } }, { fixture: { id: 43 } }] })
    );

    await expect(getFixtureById(42)).resolves.toEqual({ fixture: { id: 42 } });
  });

  it('maps the detail endpoints to their query parameters', async () => {
    await getFixtureEvents(7);
    await getFixtureLineups(7);
    await getFixtureStatistics(7);

    expect(fetchSpy.mock.calls.map((call) => call[0])).toEqual([
      'https://api.test/fixtures/events?fixture=7',
      'https://api.test/fixtures/lineups?fixture=7',
      'https://api.test/fixtures/statistics?fixture=7',
    ]);
  });
});
