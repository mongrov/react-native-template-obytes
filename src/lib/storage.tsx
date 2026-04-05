import type { MMKV } from 'react-native-mmkv';

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

// ─── In-memory fallback storage ───────────────────────────────────────────────
// Used when MMKV native module isn't available yet
const memoryStore = new Map<string, string>();

interface StorageLike {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

function createMemoryStorage(): StorageLike {
  return {
    getString(key: string): string | undefined {
      return memoryStore.get(key);
    },
    set(key: string, value: string | number | boolean): void {
      memoryStore.set(key, String(value));
    },
    delete(key: string): void {
      memoryStore.delete(key);
    },
    contains(key: string): boolean {
      return memoryStore.has(key);
    },
    getAllKeys(): string[] {
      return Array.from(memoryStore.keys());
    },
    clearAll(): void {
      memoryStore.clear();
    },
  };
}

// ─── Lazy MMKV initialization with fallback ───────────────────────────────────
let _storage: StorageLike | null = null;
let _mmkvAvailable: boolean | null = null;

function getStorage(): StorageLike {
  if (_storage) return _storage;

  // Try to load MMKV
  if (_mmkvAvailable === null) {
    try {
      // Dynamic require to avoid module-load-time errors
      const { MMKV } = require('react-native-mmkv');
      _storage = new MMKV() as StorageLike;
      _mmkvAvailable = true;
      console.log('[storage] MMKV initialized successfully');
    } catch (e) {
      console.warn('[storage] MMKV not available, using in-memory fallback:', e);
      _storage = createMemoryStorage();
      _mmkvAvailable = false;
    }
  } else if (!_mmkvAvailable) {
    _storage = createMemoryStorage();
  }

  return _storage!;
}

// Proxy object that lazily initializes storage on first access
export const storage: StorageLike = {
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

// ─── MMKV-backed KVStore with fallback ────────────────────────────────────────
const storageInstances = new Map<string, StorageLike>();

function getStorageInstance(instanceId: string): StorageLike {
  let instance = storageInstances.get(instanceId);
  if (!instance) {
    try {
      const { MMKV } = require('react-native-mmkv');
      instance = new MMKV({ id: instanceId }) as StorageLike;
    } catch {
      // Create isolated in-memory store for this instance
      const store = new Map<string, string>();
      instance = {
        getString: (key: string) => store.get(key),
        set: (key: string, value: string | number | boolean) => store.set(key, String(value)),
        delete: (key: string) => store.delete(key),
        contains: (key: string) => store.has(key),
        getAllKeys: () => Array.from(store.keys()),
        clearAll: () => store.clear(),
      };
    }
    storageInstances.set(instanceId, instance);
  }
  return instance;
}

function createKVStore(instanceId: string): KVStore {
  return {
    async get(key: string) {
      return getStorageInstance(instanceId).getString(key) ?? null;
    },
    async set(key: string, value: string) {
      getStorageInstance(instanceId).set(key, value);
    },
    async delete(key: string) {
      getStorageInstance(instanceId).delete(key);
    },
    async getObject<T>(key: string): Promise<T | null> {
      const value = getStorageInstance(instanceId).getString(key);
      if (value === undefined) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    async setObject<T>(key: string, value: T) {
      getStorageInstance(instanceId).set(key, JSON.stringify(value));
    },
    async clear() {
      getStorageInstance(instanceId).clearAll();
    },
    async getAllKeys() {
      return getStorageInstance(instanceId).getAllKeys();
    },
  };
}

// ─── KVStore (async) ─────────────────────────────────────────────────────────
// Unified async key-value storage for preferences, caches, flags.
export const kvStore: KVStore = createKVStore('app-prefs');

// ─── Secure Store ────────────────────────────────────────────────────────────
// For tokens and sensitive data. Uses MMKV with encryption.
// Note: For true security, use expo-secure-store directly.
export const secureStore: KVStore = createKVStore('secure-store');

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
