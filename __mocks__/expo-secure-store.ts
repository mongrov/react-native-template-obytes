// Mock for expo-secure-store
const storage: Map<string, string> = new Map();

export async function getItemAsync(key: string): Promise<string | null> {
  return storage.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  storage.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  storage.delete(key);
}
