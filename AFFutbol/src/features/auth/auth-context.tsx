import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform } from 'react-native';

import { describeAuthError, describeProfileError } from './errors';
import { parseAuthRedirect } from './parse-auth-redirect';
import {
  getAuthRedirectUrl,
  isSupabaseConfigured,
  requireSupabase,
  supabase,
} from './supabase';
import { normalizeEmail } from './validation';
import { releaseStoredPushToken } from '@/features/notifications/device';
import {
  deleteAccount as deleteAccountOnServer,
  fetchProfile,
  updateProfile as updateProfileRow,
} from '@/features/profile/api';
import type { Profile, ProfilePatch } from '@/features/profile/types';

WebBrowser.maybeCompleteAuthSession();

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type OAuthProvider = 'google' | 'apple';

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
};

export type SignUpResult = {
  needsEmailConfirmation: boolean;
};

export class AuthCancelledError extends Error {
  constructor() {
    super('Acceso cancelado.');
    this.name = 'AuthCancelledError';
  }
}

export function isAuthCancelled(error: unknown): boolean {
  return error instanceof AuthCancelledError;
}

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account and all its data on the server, then clears the session. */
  deleteAccount: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  completeAuthFromUrl: (url: string) => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function createAppleNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  return { rawNonce, hashedNonce };
}

function isAppleCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'unauthenticated'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const user = session?.user ?? null;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        setSession(data.session);
        setStatus(data.session ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (active) {
          setStatus('unauthenticated');
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');

      if (!nextSession) {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || Platform.OS === 'web') {
      return;
    }

    const client = supabase;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    fetchProfile(user)
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
          setProfileError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setProfile(null);
          setProfileError(describeProfileError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async ({ email, password, displayName }: SignUpInput) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          display_name: displayName.trim() || undefined,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Supabase hides existing accounts by returning a user with no identities.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('Ya existe una cuenta con este correo. Prueba a iniciar sesión.');
    }

    return { needsEmailConfirmation: !data.session };
  }, []);

  const completeAuthFromUrl = useCallback(async (url: string) => {
    const client = requireSupabase();
    const params = parseAuthRedirect(url);

    if (params.error) {
      throw new Error(params.error);
    }

    if (params.code) {
      const { error } = await client.auth.exchangeCodeForSession(params.code);

      if (error) {
        throw error;
      }

      return;
    }

    if (params.accessToken && params.refreshToken) {
      const { error } = await client.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      });

      if (error) {
        throw error;
      }

      return;
    }

    throw new Error('El enlace de acceso no es válido o ha caducado.');
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const client = requireSupabase();
    const redirectTo = getAuthRedirectUrl();

    if (Platform.OS === 'web') {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }

      return;
    }

    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error('Supabase no devolvió la URL de acceso.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success') {
      await completeAuthFromUrl(result.url);
      return;
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new AuthCancelledError();
    }

    throw new Error('No se pudo completar el acceso con el navegador.');
  }, [completeAuthFromUrl]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithOAuth('google');
  }, [signInWithOAuth]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      await signInWithOAuth('apple');
      return;
    }

    const available = await AppleAuthentication.isAvailableAsync();

    if (!available) {
      await signInWithOAuth('apple');
      return;
    }

    const client = requireSupabase();
    const { rawNonce, hashedNonce } = await createAppleNonce();

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple no devolvió un token de identidad.');
      }

      const { data: authData, error } = await client.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) {
        throw error;
      }

      if (credential.fullName) {
        const fullName = AppleAuthentication.formatFullName(credential.fullName);

        if (fullName) {
          await client.auth.updateUser({ data: { full_name: fullName } });

          if (authData.user) {
            try {
              await updateProfileRow(authData.user.id, { displayName: fullName });
            } catch {
              // The profile trigger may still be creating the row; the app
              // retries the profile fetch after the auth state changes.
            }
          }
        }
      }
    } catch (error) {
      if (isAppleCancellation(error)) {
        throw new AuthCancelledError();
      }

      throw error;
    }
  }, [signInWithOAuth]);

  const signOut = useCallback(async () => {
    const client = requireSupabase();

    // Unregister this device first: the session is still valid, and the next
    // account on this phone must not inherit the notifications.
    await releaseStoredPushToken();

    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    setProfile(null);
    setProfileError(null);
  }, []);

  /**
   * Irreversible. The push token is released first (it needs a valid session),
   * then the Edge Function deletes the auth row and every cascaded table. The
   * local session is cleared with `scope: 'local'` because the server no longer
   * knows this user and a global sign-out would fail.
   */
  const deleteAccount = useCallback(async () => {
    const client = requireSupabase();

    await releaseStoredPushToken();
    await deleteAccountOnServer();

    setProfile(null);
    setProfileError(null);

    await client.auth.signOut({ scope: 'local' });
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) {
        throw new Error('No hay una sesión activa.');
      }

      const nextProfile = await updateProfileRow(user.id, patch);
      setProfile(nextProfile);
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setProfile(await fetchProfile(user));
      setProfileError(null);
    } catch (error) {
      setProfileError(describeProfileError(error));
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user,
      profile,
      profileError,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
      requestPasswordReset,
      updatePassword,
      completeAuthFromUrl,
      updateProfile,
      refreshProfile,
    }),
    [
      status,
      session,
      user,
      profile,
      profileError,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
      requestPasswordReset,
      updatePassword,
      completeAuthFromUrl,
      updateProfile,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}

export { describeAuthError };
