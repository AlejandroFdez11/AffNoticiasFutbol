import { toDateKey } from '@/lib/format';

import { getFixtureById, getFixturesByDate } from '../fixtures';
import { toMockFixtureId } from '../mocks-data';

jest.mock('@/lib/env', () => ({
  env: {
    apiFootballKey: 'test-key',
    apiFootballBaseUrl: 'https://api.test',
    useMocks: true,
  },
}));

describe('mock routing', () => {
  it('serves fixtures from the mocks without touching the network', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const dateKey = toDateKey(new Date());

    const fixtures = await getFixturesByDate(dateKey);
    const detail = await getFixtureById(fixtures[0].fixture.id);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures[0].fixture.id).toBe(toMockFixtureId(dateKey, 0));
    expect(detail?.fixture.id).toBe(fixtures[0].fixture.id);

    jest.restoreAllMocks();
  });
});
