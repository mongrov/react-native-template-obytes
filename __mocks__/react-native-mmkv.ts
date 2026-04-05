// Mock for react-native-mmkv
const instances: Map<string, Map<string, string>> = new Map();

export class MMKV {
  private storage: Map<string, string>;
  private instanceId: string;

  constructor(config?: { id?: string }) {
    this.instanceId = config?.id ?? 'default';
    if (!instances.has(this.instanceId)) {
      instances.set(this.instanceId, new Map());
    }
    this.storage = instances.get(this.instanceId)!;
  }

  getString(key: string): string | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: string | number | boolean): void {
    this.storage.set(key, String(value));
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  contains(key: string): boolean {
    return this.storage.has(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  clearAll(): void {
    this.storage.clear();
  }
}

export function createMMKV(config?: { id?: string }): MMKV {
  return new MMKV(config);
}
