/**
 * Returns the device IANA timezone (e.g. `Europe/Madrid`).
 *
 * API-Football filters `fixtures?date=` in the requested timezone, so sending
 * the device one keeps "today" aligned with the user's calendar.
 */
export function getDeviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
