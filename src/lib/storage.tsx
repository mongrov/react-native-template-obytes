import { MMKV } from 'react-native-mmkv';

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

// ─── Lazy MMKV initialization ─────────────────────────────────────────────────
// Native modules aren't available at module load time, so we defer instantiation.
let _storage: MMKV | null = null;
function getStorage(): MMKV {
  if (!_storage) {
    _storage = new MMKV();
  }
  return _storage;
}

// Proxy object that lazily initializes MMKV on first access
export const storage = {
  getString(key: string): string | undefined {
    return getStorage().getString(key);
  },
  set(key: string, value: string | number | boolean): void {
    getStorage().set(key, value);
  },
  delete(key: string): void {
    getStorage().delete(key);
  },
  contains(key: string): boolean {
    return getStorage().contains(key);
  },
  getAllKeys(): string[] {
    return getStorage().getAllKeys();
  },
  clearAll(): void {
    getStorage().clearAll();
  },
};

// ─── MMKV-backed KVStore ──────────────────────────────────────────────────────
const mmkvInstances = new Map<string, MMKV>();

function getMMKVInstance(instanceId: string): MMKV {
  let instance = mmkvInstances.get(instanceId);
  if (!instance) {
    instance = new MMKV({ id: instanceId });
    mmkvInstances.set(instanceId, instance);
  }
  return instance;
}

function createMMKVStore(instanceId: string): KVStore {
  return {
    async get(key: string) {
      return getMMKVInstance(instanceId).getString(key) ?? null;
    },
    async set(key: string, value: string) {
      getMMKVInstance(instanceId).set(key, value);
    },
    async delete(key: string) {
      getMMKVInstance(instanceId).delete(key);
    },
    async getObject<T>(key: string): Promise<T | null> {
      const value = getMMKVInstance(instanceId).getString(key);
      if (value === undefined) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    async setObject<T>(key: string, value: T) {
      getMMKVInstance(instanceId).set(key, JSON.stringify(value));
    },
    async clear() {
      getMMKVInstance(instanceId).clearAll();
    },
    async getAllKeys() {
      return getMMKVInstance(instanceId).getAllKeys();
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
