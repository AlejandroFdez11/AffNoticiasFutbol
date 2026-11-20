import * as SecureStore from 'expo-secure-store';

/** Small key/value adapter for non-sensitive local preferences (native). */
export const localStore = {
  getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string): Promise<void> {
    return SecureStore.deleteItemAsync(key);
  },
};
