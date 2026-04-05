import { createMMKV } from 'react-native-mmkv';
import { createKVStore, createTokenStore } from '@mongrov/db';
import type { KVStore, TokenStore } from '@mongrov/db';

// ─── Raw MMKV (sync) ─────────────────────────────────────────────────────────
// Used by theme for sync initialization at module load.
// Prefer kvStore for new code.
export const storage = createMMKV();

// ─── KVStore (async) ─────────────────────────────────────────────────────────
// Unified async key-value storage for preferences, caches, flags.
export const kvStore: KVStore = createKVStore({ instanceId: 'app-prefs' });

// ─── Secure Store ────────────────────────────────────────────────────────────
// For tokens and sensitive data. Uses expo-secure-store.
export const secureStore: KVStore = createKVStore({ secure: true });

// ─── Token Store ─────────────────────────────────────────────────────────────
// For @mongrov/auth integration.
export const tokenStore: TokenStore = createTokenStore(secureStore);

// ─── Legacy helpers (use kvStore methods directly for new code) ──────────────

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? JSON.parse(value) || null : null;
}

export async function setItem<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  storage.remove(key);
}
