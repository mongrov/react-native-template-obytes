jest.mock('@/lib/storage', () => ({
  kvStore: {
    set: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  },
}));

const mockKvStore = jest.requireMock('@/lib/storage').kvStore as any;

describe('useCollabStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports useCollabStore hook', () => {
    const { useCollabStore } = require('../store');
    expect(useCollabStore).toBeDefined();
  });

  it('has setCredentials method', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(typeof store.setCredentials).toBe('function');
  });

  it('has clearCredentials method', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(typeof store.clearCredentials).toBe('function');
  });

  it('has hydrate method', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(typeof store.hydrate).toBe('function');
  });

  it('has authToken state property', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(store).toHaveProperty('authToken');
  });

  it('has userId state property', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(store).toHaveProperty('userId');
  });

  it('has isAuthenticated state property', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();
    expect(store).toHaveProperty('isAuthenticated');
  });

  it('setCredentials stores values in kvStore', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();

    store.setCredentials('test_token', 'test_user');

    expect(mockKvStore.set).toHaveBeenCalledWith('collab:authToken', 'test_token');
    expect(mockKvStore.set).toHaveBeenCalledWith('collab:userId', 'test_user');
  });

  it('clearCredentials removes values from kvStore', () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();

    store.clearCredentials();

    expect(mockKvStore.delete).toHaveBeenCalledWith('collab:authToken');
    expect(mockKvStore.delete).toHaveBeenCalledWith('collab:userId');
  });

  it('hydrate is an async method', async () => {
    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();

    const result = store.hydrate();
    expect(result instanceof Promise).toBe(true);
    await result;
  });

  it('hydrate reads from kvStore', async () => {
    mockKvStore.get.mockResolvedValue(null);

    const { useCollabStore } = require('../store');
    const store = useCollabStore.getState();

    await store.hydrate();

    expect(mockKvStore.get).toHaveBeenCalledWith('collab:authToken');
    expect(mockKvStore.get).toHaveBeenCalledWith('collab:userId');
  });
});
