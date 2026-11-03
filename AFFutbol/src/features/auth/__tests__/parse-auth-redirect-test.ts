import { parseAuthRedirect } from '../parse-auth-redirect';

describe('parseAuthRedirect', () => {
  it('reads PKCE codes from the query string', () => {
    expect(parseAuthRedirect('affutbol://auth-callback?code=abc123&type=recovery')).toEqual({
      code: 'abc123',
      accessToken: null,
      refreshToken: null,
      type: 'recovery',
      error: null,
    });
  });

  it('reads implicit tokens from the hash', () => {
    expect(
      parseAuthRedirect(
        'affutbol://auth-callback#access_token=access&refresh_token=refresh&type=signup'
      )
    ).toEqual({
      code: null,
      accessToken: 'access',
      refreshToken: 'refresh',
      type: 'signup',
      error: null,
    });
  });

  it('prefers hash params over query params', () => {
    const result = parseAuthRedirect(
      'https://example.com/auth-callback?code=query#access_token=hash&refresh_token=refresh'
    );

    expect(result.code).toBe('query');
    expect(result.accessToken).toBe('hash');
  });

  it('exposes provider errors', () => {
    const result = parseAuthRedirect(
      'affutbol://auth-callback?error=access_denied&error_description=User%20cancelled'
    );

    expect(result.error).toBe('User cancelled');
  });

  it('returns a friendly error for invalid URLs', () => {
    expect(parseAuthRedirect('not a url').error).toBe('El enlace de acceso no es válido.');
  });
});
