import { tokenStore } from '../secure-token';

const mockStore: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

describe('tokenStore', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
    jest.clearAllMocks();
  });

  it('should store and retrieve an access token', async () => {
    await tokenStore.set('my-access-token');
    const token = await tokenStore.get();
    expect(token).toBe('my-access-token');
  });

  it('should store and retrieve a refresh token', async () => {
    await tokenStore.setRefresh('my-refresh-token');
    const token = await tokenStore.getRefresh();
    expect(token).toBe('my-refresh-token');
  });

  it('should return null when no token is stored', async () => {
    const token = await tokenStore.get();
    expect(token).toBeNull();
  });

  it('should clear both tokens', async () => {
    await tokenStore.set('access');
    await tokenStore.setRefresh('refresh');

    await tokenStore.clear();

    const access = await tokenStore.get();
    const refresh = await tokenStore.getRefresh();
    expect(access).toBeNull();
    expect(refresh).toBeNull();
  });
});
