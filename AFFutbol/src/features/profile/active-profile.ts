import { localStore } from '@/lib/storage';

/** The active profile is a local preference, keyed by account so switching accounts is safe. */
function storageKey(userId: string): string {
  return `affutbol.active_profile.${userId}`;
}

export async function getActiveProfileId(userId: string): Promise<string | null> {
  return (await localStore.getItem(storageKey(userId))) || null;
}

export async function setActiveProfileId(userId: string, profileId: string): Promise<void> {
  await localStore.setItem(storageKey(userId), profileId);
}

export async function clearActiveProfileId(userId: string): Promise<void> {
  await localStore.removeItem(storageKey(userId));
}
