import { authorizeNewsRefresh } from '../../../../supabase/functions/_shared/news-auth';

const BASE = {
  newsSecret: 'cron-secret',
  publicKeys: ['sb_publishable_default_abc', 'legacy-anon-jwt'],
  serviceRoleKey: 'service-role-key',
} as const;

describe('news-refresh authorization', () => {
  it('accepts the cron shared secret without bypassing the publisher throttle', () => {
    const result = authorizeNewsRefresh({ ...BASE, cronHeader: 'cron-secret' });

    expect(result).toEqual({ authorized: true, caller: 'cron', force: false });
  });

  it('accepts the app public key from either the apikey or authorization header', () => {
    expect(
      authorizeNewsRefresh({ ...BASE, apiKeyHeader: 'sb_publishable_default_abc' })
    ).toEqual({ authorized: true, caller: 'app', force: false });

    expect(
      authorizeNewsRefresh({ ...BASE, authorizationHeader: 'Bearer legacy-anon-jwt' })
    ).toEqual({ authorized: true, caller: 'app', force: false });
  });

  it('lets the service role bypass the throttle for manual maintenance', () => {
    const result = authorizeNewsRefresh({
      ...BASE,
      authorizationHeader: 'Bearer service-role-key',
    });

    expect(result).toEqual({ authorized: true, caller: 'service', force: true });
  });

  it('rejects unknown credentials, a missing secret and a missing public key', () => {
    expect(authorizeNewsRefresh({ ...BASE, cronHeader: 'wrong' })).toEqual({
      authorized: false,
    });
    expect(authorizeNewsRefresh({ ...BASE, apiKeyHeader: 'wrong' })).toEqual({
      authorized: false,
    });
    expect(
      authorizeNewsRefresh({ ...BASE, newsSecret: null, cronHeader: 'cron-secret' })
    ).toEqual({ authorized: false });
    expect(
      authorizeNewsRefresh({
        ...BASE,
        publicKeys: [],
        apiKeyHeader: 'sb_publishable_default_abc',
      })
    ).toEqual({ authorized: false });
  });

  it('does not treat an empty bearer token as a valid key', () => {
    expect(
      authorizeNewsRefresh({ ...BASE, authorizationHeader: 'Bearer   ', publicKeys: [''] })
    ).toEqual({ authorized: false });
  });
});
