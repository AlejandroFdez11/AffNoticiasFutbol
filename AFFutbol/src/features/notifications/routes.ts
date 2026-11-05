/**
 * Routes a push notification may open.
 *
 * The backend sends `{ url }` in the notification data. Only these paths are
 * accepted: a malformed payload must never send the app somewhere unexpected.
 */

const NOTIFICATION_ROUTES = [
  /^\/predictions$/,
  /^\/rankings$/,
  /^\/match\/\d+$/,
];

export function readNotificationUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const url = (data as { url?: unknown }).url;

  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  return NOTIFICATION_ROUTES.some((route) => route.test(trimmed)) ? trimmed : null;
}
