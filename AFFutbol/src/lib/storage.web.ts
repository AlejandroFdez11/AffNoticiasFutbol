/** Web counterpart of `localStore`, with an in-memory fallback. */
const memory = new Map<string, string>();

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const localStore = {
  getItem(key: string): string | null {
    return getLocalStorage()?.getItem(key) ?? memory.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    const storage = getLocalStorage();

    if (storage) {
      storage.setItem(key, value);
      return;
    }

    memory.set(key, value);
  },
  removeItem(key: string): void {
    getLocalStorage()?.removeItem(key);
    memory.delete(key);
  },
};
