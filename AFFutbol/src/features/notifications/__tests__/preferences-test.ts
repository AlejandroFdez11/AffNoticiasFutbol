import { readNotificationUrl } from '../routes';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mapNotificationPreferences,
  toNotificationPreferencesPatch,
} from '../types';

describe('mapNotificationPreferences', () => {
  it('defaults to everything on when the user has no row', () => {
    expect(mapNotificationPreferences(null)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(mapNotificationPreferences(undefined)).toEqual({
      matchReminders: true,
      matchResults: true,
      rankingChanges: true,
    });
  });

  it('maps the snake_case row', () => {
    expect(
      mapNotificationPreferences({
        user_id: 'user-1',
        match_reminders: false,
        match_results: true,
        ranking_changes: false,
      })
    ).toEqual({
      matchReminders: false,
      matchResults: true,
      rankingChanges: false,
    });
  });
});

describe('toNotificationPreferencesPatch', () => {
  it('only sends the columns that changed', () => {
    expect(toNotificationPreferencesPatch({ matchResults: false })).toEqual({
      match_results: false,
    });
    expect(
      toNotificationPreferencesPatch({ matchReminders: true, rankingChanges: false })
    ).toEqual({ match_reminders: true, ranking_changes: false });
  });

  it('returns an empty patch when nothing changed', () => {
    expect(toNotificationPreferencesPatch({})).toEqual({});
  });
});

describe('readNotificationUrl', () => {
  it('accepts the routes the backend sends', () => {
    expect(readNotificationUrl({ url: '/predictions' })).toBe('/predictions');
    expect(readNotificationUrl({ url: '/rankings' })).toBe('/rankings');
    expect(readNotificationUrl({ url: '/match/1234' })).toBe('/match/1234');
  });

  it('trims whitespace', () => {
    expect(readNotificationUrl({ url: '  /predictions ' })).toBe('/predictions');
  });

  it('rejects unknown or malformed routes', () => {
    expect(readNotificationUrl({ url: '/admin' })).toBeNull();
    expect(readNotificationUrl({ url: 'https://example.com' })).toBeNull();
    expect(readNotificationUrl({ url: '/match/abc' })).toBeNull();
    expect(readNotificationUrl({ url: 42 })).toBeNull();
    expect(readNotificationUrl({})).toBeNull();
    expect(readNotificationUrl(null)).toBeNull();
  });
});
