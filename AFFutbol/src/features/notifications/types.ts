/** Notification preferences, mapped from `public.notification_preferences`. */

export type NotificationPreferences = {
  matchReminders: boolean;
  matchResults: boolean;
  rankingChanges: boolean;
};

export type NotificationPreferencesRow = {
  user_id: string;
  match_reminders: boolean;
  match_results: boolean;
  ranking_changes: boolean;
};

export type NotificationPreferenceKey = keyof NotificationPreferences;

/** Missing rows mean "everything on", matching the table defaults. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  matchReminders: true,
  matchResults: true,
  rankingChanges: true,
};

export function mapNotificationPreferences(
  row: NotificationPreferencesRow | null | undefined
): NotificationPreferences {
  if (!row) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    matchReminders: row.match_reminders,
    matchResults: row.match_results,
    rankingChanges: row.ranking_changes,
  };
}

/** Only the columns the client is allowed to write, in snake_case. */
export function toNotificationPreferencesPatch(
  patch: Partial<NotificationPreferences>
): Partial<NotificationPreferencesRow> {
  const row: Partial<NotificationPreferencesRow> = {};

  if (patch.matchReminders !== undefined) {
    row.match_reminders = patch.matchReminders;
  }

  if (patch.matchResults !== undefined) {
    row.match_results = patch.matchResults;
  }

  if (patch.rankingChanges !== undefined) {
    row.ranking_changes = patch.rankingChanges;
  }

  return row;
}

/**
 * `unavailable` means the platform has no push support at all (web), so the UI
 * explains it instead of showing a switch the user cannot use.
 */
export type PushPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type DevicePushState = {
  /** Expo push token stored on this device, or null when notifications are off. */
  token: string | null;
  permission: PushPermissionState;
};

export const OFF_DEVICE_PUSH_STATE: DevicePushState = {
  token: null,
  permission: 'unavailable',
};
