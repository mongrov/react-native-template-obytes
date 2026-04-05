// Mock for @mongrov/db
// Provides in-memory KVStore and TokenStore implementations for testing

const mmkvStorage: Map<string, Map<string, string>> = new Map();
const secureStorage: Map<string, string> = new Map();

export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  getObject<T>(key: string): Promise<T | null>;
  setObject<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export interface KVStoreConfig {
  secure?: boolean;
  instanceId?: string;
}

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

function createMMKVStore(instanceId: string): KVStore {
  if (!mmkvStorage.has(instanceId)) {
    mmkvStorage.set(instanceId, new Map());
  }
  const storage = mmkvStorage.get(instanceId)!;

  return {
    async get(key: string): Promise<string | null> {
      return storage.get(key) ?? null;
    },
    async set(key: string, value: string): Promise<void> {
      storage.set(key, value);
    },
    async delete(key: string): Promise<void> {
      storage.delete(key);
    },
    async getObject<T>(key: string): Promise<T | null> {
      const value = storage.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    async setObject<T>(key: string, value: T): Promise<void> {
      storage.set(key, JSON.stringify(value));
    },
    async clear(): Promise<void> {
      storage.clear();
    },
    async getAllKeys(): Promise<string[]> {
      return Array.from(storage.keys());
    },
  };
}

function createSecureStore(): KVStore {
  return {
    async get(key: string): Promise<string | null> {
      return secureStorage.get(key) ?? null;
    },
    async set(key: string, value: string): Promise<void> {
      secureStorage.set(key, value);
    },
    async delete(key: string): Promise<void> {
      secureStorage.delete(key);
    },
    async getObject<T>(key: string): Promise<T | null> {
      const value = secureStorage.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    async setObject<T>(key: string, value: T): Promise<void> {
      secureStorage.set(key, JSON.stringify(value));
    },
    async clear(): Promise<void> {
      secureStorage.clear();
    },
    async getAllKeys(): Promise<string[]> {
      return Array.from(secureStorage.keys());
    },
  };
}

export function createKVStore(config?: KVStoreConfig): KVStore {
  if (config?.secure) {
    return createSecureStore();
  }
  return createMMKVStore(config?.instanceId ?? 'mongrov-kv');
}

export function createTokenStore(kvStore: KVStore): TokenStore {
  const ACCESS_KEY = 'mongrov.auth-access';
  const REFRESH_KEY = 'mongrov.auth-refresh';

  return {
    async getAccessToken(): Promise<string | null> {
      return kvStore.get(ACCESS_KEY);
    },
    async setAccessToken(token: string): Promise<void> {
      await kvStore.set(ACCESS_KEY, token);
    },
    async getRefreshToken(): Promise<string | null> {
      return kvStore.get(REFRESH_KEY);
    },
    async setRefreshToken(token: string): Promise<void> {
      await kvStore.set(REFRESH_KEY, token);
    },
    async clear(): Promise<void> {
      await kvStore.delete(ACCESS_KEY);
      await kvStore.delete(REFRESH_KEY);
    },
  };
}
