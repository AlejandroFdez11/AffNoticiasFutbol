import { env } from '@/lib/env';

import {
  API_FOOTBALL_TIMEOUT_MS,
  ApiFootballError,
  apiFootballRequest,
  describeApiFootballError,
} from '../client';

jest.mock('@/lib/env', () => ({
  env: {
    apiFootballKey: 'test-key',
    apiFootballBaseUrl: 'https://api.test',
    useMocks: false,
  },
}));

type TestEnv = {
  apiFootballKey: string | undefined;
  apiFootballBaseUrl: string;
  useMocks: boolean;
};

const testEnv = env as unknown as TestEnv;

function jsonResponse(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

async function getError(promise: Promise<unknown>): Promise<ApiFootballError> {
  const error = await promise.catch((thrown: unknown) => thrown);
  expect(error).toBeInstanceOf(ApiFootballError);
  return error as ApiFootballError;
}

let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  testEnv.apiFootballKey = 'test-key';
  testEnv.apiFootballBaseUrl = 'https://api.test';
});

describe('apiFootballRequest', () => {
  it('builds the URL, sends the key header and unwraps the response', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ errors: [], response: [{ id: 1 }] }));

    const result = await apiFootballRequest('/fixtures', {
      date: '2026-10-30',
      page: 1,
      ignored: undefined,
      empty: '',
    });

    expect(result).toEqual([{ id: 1 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/fixtures?date=2026-10-30&page=1');
    expect(options).toMatchObject({
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-apisports-key': 'test-key',
      },
    });
  });

  it('normalizes trailing slashes in the base URL', async () => {
    testEnv.apiFootballBaseUrl = 'https://api.test/';
    fetchSpy.mockResolvedValue(jsonResponse({ errors: [], response: [] }));

    await apiFootballRequest('fixtures', { id: 3 });

    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.test/fixtures?id=3');
  });

  it('fails with a typed error when there is no API key', async () => {
    testEnv.apiFootballKey = undefined;

    const error = await getError(apiFootballRequest('/fixtures'));

    expect(error.code).toBe('missing-key');
    expect(error.userMessage).toMatch(/API key/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    [{ plan: 'Free plans do not have access to this season' }, 'plan'],
    [{ season: 'The Season field is required.' }, 'plan'],
    [{ requests: 'You have reached the request limit' }, 'quota'],
    [{ token: 'Invalid API key' }, 'auth'],
    [{ unexpected: 'Something else' }, 'api'],
  ] as const)('maps the %o API error to %s', async (errors, code) => {
    fetchSpy.mockResolvedValue(jsonResponse({ errors, response: [] }));

    const error = await getError(apiFootballRequest('/fixtures'));

    expect(error.code).toBe(code);
  });

  it('maps HTTP failures', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(undefined, { ok: false, status: 500 }));

    const error = await getError(apiFootballRequest('/fixtures'));

    expect(error.code).toBe('http');
    expect(error.status).toBe(500);
    expect(error.message).toContain('500');
  });

  it('maps network failures', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Network request failed'));

    const error = await getError(apiFootballRequest('/fixtures'));

    expect(error.code).toBe('network');
  });

  it('aborts slow requests with a timeout error', async () => {
    jest.useFakeTimers();
    fetchSpy.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        })
    );

    const promise = apiFootballRequest('/fixtures');
    jest.advanceTimersByTime(API_FOOTBALL_TIMEOUT_MS);
    const error = await getError(promise);

    expect(error.code).toBe('timeout');
  });

  it('maps invalid JSON payloads', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Response);

    const error = await getError(apiFootballRequest('/fixtures'));

    expect(error.code).toBe('api');
  });
});

describe('describeApiFootballError', () => {
  it('prefers the user message for typed errors', () => {
    expect(describeApiFootballError(new ApiFootballError('quota'))).toMatch(/peticiones diarias/);
  });

  it('falls back to the error message and then to a generic one', () => {
    expect(describeApiFootballError(new Error('boom'))).toBe('boom');
    expect(describeApiFootballError('nope')).toMatch(/error inesperado/);
  });
});
