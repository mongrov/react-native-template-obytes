/**
 * Storage utilities for the app.
 *
 * Uses @mongrov/db for async KVStore instances.
 * Provides a sync storage wrapper for legacy code (theme, i18n).
 */

import { createKVStore, type KVStore } from '@mongrov/db/kv';

// Re-export types from @mongrov/db
export type { KVStore } from '@mongrov/db/kv';

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}

// ─── Sync storage interface (for theme/i18n) ──────────────────────────────────
// Theme and i18n need synchronous access for initial render.
// This wrapper provides sync methods with lazy MMKV initialization.

interface SyncStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

// In-memory fallback
function createMemoryStorage(): SyncStorage {
  const store = new Map<string, string>();
  return {
    getString: (key: string) => store.get(key),
    set: (key: string, value: string | number | boolean) => store.set(key, String(value)),
    delete: (key: string) => store.delete(key),
    contains: (key: string) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
  };
}

// Lazy sync storage with MMKV + fallback
let _syncStorage: SyncStorage | null = null;

function getSyncStorage(): SyncStorage {
  if (_syncStorage) return _syncStorage;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    _syncStorage = new MMKV() as SyncStorage;
  } catch {
    _syncStorage = createMemoryStorage();
  }

  return _syncStorage;
}

/**
 * Synchronous storage for theme and i18n.
 * Uses MMKV with in-memory fallback.
 */
export const storage: SyncStorage = {
  getString: (key: string) => getSyncStorage().getString(key),
  set: (key: string, value: string | number | boolean) => getSyncStorage().set(key, value),
  delete: (key: string) => getSyncStorage().delete(key),
  contains: (key: string) => getSyncStorage().contains(key),
  getAllKeys: () => getSyncStorage().getAllKeys(),
  clearAll: () => getSyncStorage().clearAll(),
};

// ─── Async KVStore instances (from @mongrov/db) ───────────────────────────────

/**
 * General-purpose async key-value storage for preferences, caches, flags.
 */
export const kvStore: KVStore = createKVStore({ instanceId: 'app-prefs' });

/**
 * Secure storage for tokens and sensitive data.
 * Note: For true security, use expo-secure-store via createKVStore({ secure: true }).
 */
export const secureStore: KVStore = createKVStore({ instanceId: 'secure-store' });

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
