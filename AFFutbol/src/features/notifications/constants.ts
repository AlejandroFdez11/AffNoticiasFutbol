/** Fixed values shared by the push notification client code. */

/** Android notification channel, mirrored by the `send-push` Edge Function. */
export const NOTIFICATION_CHANNEL_ID = 'default';
export const NOTIFICATION_CHANNEL_NAME = 'AFFutbol';

/** Where the Expo push token of this device is kept (AsyncStorage). */
export const PUSH_TOKEN_STORAGE_KEY = '@affutbol/push-token';

export const NOTIFICATION_PREFERENCES_STALE_TIME_MS = 60_000;
export const DEVICE_STATE_STALE_TIME_MS = 30_000;

/** The backend reminds 60 minutes before kickoff. */
export const REMINDER_LEAD_MINUTES = 60;
