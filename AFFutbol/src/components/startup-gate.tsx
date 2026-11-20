import * as Linking from 'expo-linking';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

/** Reset only on a cold start (module reload), not on every navigation. */
let presentedOnLaunch = false;

/**
 * Netflix-style entry point: the first screen of a cold start is the profile
 * picker (or the sign-in card when there is no session). Deep links keep their
 * original destination, and the user can always browse from the picker.
 */
export function StartupGate() {
  const router = useRouter();
  const pathname = usePathname();
  // Snapshot the first render: later navigations must not re-trigger the gate.
  const [initialPath] = useState(pathname);
  const [initialUrl] = useState(Linking.useURL());
  const handled = useRef(false);
  const { status } = useAuth();

  useEffect(() => {
    if (presentedOnLaunch || handled.current || status === 'loading') {
      return;
    }

    handled.current = true;

    // A deep link (OAuth callback, legal page, match…) must not be hijacked.
    // Expo Go also exposes an `exp://...` URL on every launch: only a non-root
    // path counts as a deep link.
    const deepLinkPath = Platform.OS === 'web' || !initialUrl ? '' : Linking.parse(initialUrl).path;
    if (initialPath !== '/' || (deepLinkPath && deepLinkPath !== '/')) {
      return;
    }

    presentedOnLaunch = true;
    router.replace('/select-profile');
  }, [initialPath, initialUrl, router, status]);

  return null;
}
