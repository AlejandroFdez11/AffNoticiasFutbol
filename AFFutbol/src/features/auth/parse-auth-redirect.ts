export type AuthRedirectParams = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  error: string | null;
};

/**
 * Supabase can return the auth result in the query string (PKCE) or in the
 * hash (implicit flow / older email templates). This helper reads both.
 */
export function parseAuthRedirect(url: string): AuthRedirectParams {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return {
      code: null,
      accessToken: null,
      refreshToken: null,
      type: null,
      error: 'El enlace de acceso no es válido.',
    };
  }

  const search = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));

  const get = (key: string) => hash.get(key) ?? search.get(key);

  return {
    code: get('code'),
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    type: get('type'),
    error: get('error_description') ?? get('error_code') ?? get('error'),
  };
}
