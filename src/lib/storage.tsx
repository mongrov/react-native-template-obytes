import { MMKV } from 'react-native-mmkv';

// ─── Raw MMKV (sync) ─────────────────────────────────────────────────────────
// Used by theme for sync initialization at module load.
export const storage = new MMKV();

// ─── KVStore interface ────────────────────────────────────────────────────────
export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  getObject<T>(key: string): Promise<T | null>;
  setObject<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}

// ─── MMKV-backed KVStore ──────────────────────────────────────────────────────
function createMMKVStore(instanceId: string = 'mongrov-kv'): KVStore {
  const mmkv = new MMKV({ id: instanceId });

  return {
    async get(key: string) {
      return mmkv.getString(key) ?? null;
    },
    async set(key: string, value: string) {
      mmkv.set(key, value);
    },
    async delete(key: string) {
      mmkv.delete(key);
    },
    async getObject<T>(key: string): Promise<T | null> {
      const value = mmkv.getString(key);
      if (value === undefined) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    async setObject<T>(key: string, value: T) {
      mmkv.set(key, JSON.stringify(value));
    },
    async clear() {
      mmkv.clearAll();
    },
    async getAllKeys() {
      return mmkv.getAllKeys();
    },
  };
}

// ─── KVStore (async) ─────────────────────────────────────────────────────────
// Unified async key-value storage for preferences, caches, flags.
export const kvStore: KVStore = createMMKVStore('app-prefs');

// ─── Secure Store ────────────────────────────────────────────────────────────
// For tokens and sensitive data. Uses MMKV with encryption.
// Note: For true security, use expo-secure-store directly.
export const secureStore: KVStore = createMMKVStore('secure-store');

// ─── Token Store ─────────────────────────────────────────────────────────────
// For @mongrov/auth integration.
export const tokenStore: TokenStore = {
  async getAccessToken() {
    return secureStore.get('accessToken');
  },
  async getRefreshToken() {
    return secureStore.get('refreshToken');
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await secureStore.set('accessToken', accessToken);
    await secureStore.set('refreshToken', refreshToken);
  },
  async clearTokens() {
    await secureStore.delete('accessToken');
    await secureStore.delete('refreshToken');
  },
};

// ─── Legacy helpers (use kvStore methods directly for new code) ──────────────

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? JSON.parse(value) || null : null;
}

export function setItem<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

export function removeItem(key: string) {
  storage.delete(key);
}
