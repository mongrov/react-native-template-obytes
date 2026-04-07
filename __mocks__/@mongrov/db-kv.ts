/**
 * Mock for @mongrov/db/kv
 */

export interface KVStore {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
  contains(key: string): boolean;
  clearAll(): void;
  getAllKeys(): string[];
}

const store = new Map<string, string | number | boolean>();

export function createKVStore(): KVStore {
  return {
    getString: (key: string) => {
      const val = store.get(key);
      return typeof val === 'string' ? val : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      store.set(key, value);
    },
    delete: (key: string) => {
      store.delete(key);
    },
    contains: (key: string) => store.has(key),
    clearAll: () => store.clear(),
    getAllKeys: () => Array.from(store.keys()),
  };
}
