import * as SecureStore from 'expo-secure-store';

/**
 * iOS Keychain rejects large values on some releases. Supabase sessions can
 * easily exceed that limit, so values are split into fixed-size chunks and a
 * manifest key keeps track of how many chunks belong to the session.
 */
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '.chunks';

function chunkValue(value: string, size = CHUNK_SIZE): string[] {
  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }

  return chunks;
}

async function removeChunks(key: string): Promise<void> {
  const rawCount = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  const count = rawCount ? Number.parseInt(rawCount, 10) : 0;

  if (!Number.isFinite(count) || count <= 0) {
    return;
  }

  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(`${key}.${index}`)
    )
  );
  await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
}

export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    const rawCount = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
    const count = rawCount ? Number.parseInt(rawCount, 10) : 0;

    if (!Number.isFinite(count) || count <= 0) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(`${key}.${index}`)
      )
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = chunkValue(value);

    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}.${index}`, chunk))
    );
    await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};
