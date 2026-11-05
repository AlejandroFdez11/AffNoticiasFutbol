/**
 * Web has no Expo push support, so the bridge is a no-op there. The
 * notifications card explains the limitation instead of showing a switch.
 */

export function NotificationBridge() {
  return null;
}
