import { storage } from '@/lib/storage';

// Try to use expo-secure-store for sensitive token storage.
// Falls back to MMKV when the native module isn't available (e.g., Expo Go).
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
}
catch {
  // Native module not available — fall back to MMKV below
}

const KEYS = { access: 'auth_token', refresh: 'refresh_token' } as const;

function get(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return Promise.resolve(storage.getString(key) ?? null);
}

function set(key: string, value: string): Promise<void> {
  if (SecureStore) {
    return SecureStore.setItemAsync(key, value);
  }
  storage.set(key, value);
  return Promise.resolve();
}

function remove(key: string): Promise<void> {
  if (SecureStore) {
    return SecureStore.deleteItemAsync(key);
  }
  storage.remove(key);
  return Promise.resolve();
}

export const tokenStore = {
  get: () => get(KEYS.access),
  set: (token: string) => set(KEYS.access, token),
  getRefresh: () => get(KEYS.refresh),
  setRefresh: (token: string) => set(KEYS.refresh, token),
  clear: () => Promise.all([remove(KEYS.access), remove(KEYS.refresh)]),
};
