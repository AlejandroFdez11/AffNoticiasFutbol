import {
  ALLOWED_ENDPOINTS,
  buildUpstreamUrl,
  parseProxyRequest,
} from '../../../../supabase/functions/_shared/api-football-proxy';

describe('parseProxyRequest', () => {
  it('accepts the endpoints the app uses', () => {
    const result = parseProxyRequest({
      path: '/fixtures',
      params: { date: '2026-11-10', timezone: 'Europe/Madrid' },
    });

    expect(result).toEqual({
      ok: true,
      request: {
        path: '/fixtures',
        params: { date: '2026-11-10', timezone: 'Europe/Madrid' },
      },
    });
  });

  it('normalizes a path without a leading slash', () => {
    const result = parseProxyRequest({ path: 'fixtures/lineups', params: { fixture: 123 } });

    expect(result).toEqual({
      ok: true,
      request: { path: '/fixtures/lineups', params: { fixture: 123 } },
    });
  });

  it('rejects endpoints outside the allowlist', () => {
    const result = parseProxyRequest({ path: '/teams', params: { league: 140 } });

    expect(result).toMatchObject({ ok: false, code: 'bad-path' });
  });

  it('rejects parameters outside the allowlist', () => {
    const result = parseProxyRequest({
      path: '/fixtures',
      params: { date: '2026-11-10', season: 2026 },
    });

    expect(result).toMatchObject({ ok: false, code: 'bad-params' });
  });

  it('requires a parameter that identifies the resource', () => {
    const result = parseProxyRequest({
      path: '/fixtures',
      params: { timezone: 'Europe/Madrid' },
    });

    expect(result).toMatchObject({ ok: false, code: 'bad-params' });
  });

  it('rejects empty, oversized and non-scalar values', () => {
    expect(parseProxyRequest({ path: '/fixtures', params: { id: '' } })).toMatchObject({
      ok: false,
    });
    expect(
      parseProxyRequest({ path: '/fixtures', params: { id: 'x'.repeat(65) } })
    ).toMatchObject({ ok: false });
    expect(
      parseProxyRequest({ path: '/fixtures', params: { id: { nested: true } } })
    ).toMatchObject({ ok: false });
    expect(parseProxyRequest({ path: '/fixtures', params: { id: Number.NaN } })).toMatchObject({
      ok: false,
    });
  });

  it('rejects a body that is not an object', () => {
    expect(parseProxyRequest(null)).toMatchObject({ ok: false, code: 'bad-params' });
    expect(parseProxyRequest([])).toMatchObject({ ok: false, code: 'bad-params' });
    expect(parseProxyRequest(undefined)).toMatchObject({ ok: false, code: 'bad-params' });
  });

  it('rejects a missing path', () => {
    expect(parseProxyRequest({ params: { date: '2026-11-10' } })).toMatchObject({
      ok: false,
      code: 'bad-path',
    });
  });
});

describe('buildUpstreamUrl', () => {
  it('normalizes the base url and encodes the query', () => {
    expect(
      buildUpstreamUrl('https://v3.football.api-sports.io/', '/fixtures', {
        date: '2026-11-10',
        timezone: 'Europe/Madrid',
      })
    ).toBe('https://v3.football.api-sports.io/fixtures?date=2026-11-10&timezone=Europe%2FMadrid');
  });

  it('returns the bare path when there are no params', () => {
    expect(buildUpstreamUrl('https://v3.football.api-sports.io', '/fixtures', {})).toBe(
      'https://v3.football.api-sports.io/fixtures'
    );
  });
});

describe('ALLOWED_ENDPOINTS', () => {
  it('only lists the endpoints used by the client', () => {
    expect(Object.keys(ALLOWED_ENDPOINTS).sort()).toEqual([
      '/fixtures',
      '/fixtures/events',
      '/fixtures/lineups',
      '/fixtures/statistics',
    ]);
  });
});
