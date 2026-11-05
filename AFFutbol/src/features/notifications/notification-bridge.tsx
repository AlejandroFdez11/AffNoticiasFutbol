/**
 * Keeps the device token fresh and opens the right screen when the user taps a
 * notification. Mounted once inside `AuthProvider` (see `src/app/_layout.tsx`).
 *
 * The web build has no push support, so `notification-bridge.web.tsx` is empty.
 */

import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-context';

import { syncStoredPushToken } from './device';
import { readNotificationUrl } from './routes';

/** Notifications that arrive with the app in the foreground are still shown. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function NotificationBridge() {
  const { status } = useAuth();
  const lastResponse = Notifications.useLastNotificationResponse();

  // After a login (or a cold start) re-register the stored token: the device may
  // have changed accounts, and `register_push_token()` reassigns it.
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void syncStoredPushToken();
  }, [status]);

  useEffect(() => {
    if (!lastResponse) {
      return;
    }

    const url = readNotificationUrl(lastResponse.notification.request.content.data);
    Notifications.clearLastNotificationResponse();

    if (url) {
      router.push(url as Href);
    }
  }, [lastResponse]);

  return null;
}
