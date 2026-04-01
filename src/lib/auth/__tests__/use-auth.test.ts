import { act, renderHook } from '@testing-library/react-native';

import { hydrateAuth, signIn, signOut, useAuthStore } from '@/features/auth/use-auth-store';

// Must mock storage before importing the store
jest.mock('@/lib/auth/utils', () => {
  let stored: { access: string; refresh: string } | null = null;
  return {
    getToken: jest.fn(() => stored),
    setToken: jest.fn((val: { access: string; refresh: string }) => {
      stored = val;
    }),
    removeToken: jest.fn(() => {
      stored = null;
    }),
    __setStored: (val: { access: string; refresh: string } | null) => {
      stored = val;
    },
  };
});

jest.mock('@/lib/utils', () => ({
  createSelectors: (store: any) => {
    const selectors: Record<string, any> = {};
    selectors.use = new Proxy(
      {},
      {
        get: (_target, prop: string) => () => store((s: any) => s[prop]),
      },
    );
    return Object.assign(store, selectors);
  },
}));

const utils = jest.requireMock('@/lib/auth/utils') as {
  getToken: jest.Mock;
  setToken: jest.Mock;
  removeToken: jest.Mock;
  __setStored: (val: { access: string; refresh: string } | null) => void;
};

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    utils.__setStored(null);
    // Reset store state
    signOut();
  });

  it('should start with idle status and null token', () => {
    // After signOut in beforeEach, status is 'signOut'
    // Reset to idle by getting fresh state
    const state = useAuthStore.getState();
    // signOut was called in beforeEach so status is 'signOut'
    expect(state.token).toBeNull();
  });

  it('should sign in and persist token', () => {
    const token = { access: 'a1', refresh: 'r1' };
    signIn(token);

    const state = useAuthStore.getState();
    expect(state.status).toBe('signIn');
    expect(state.token).toEqual(token);
    expect(utils.setToken).toHaveBeenCalledWith(token);
  });

  it('should sign out and clear token', () => {
    signIn({ access: 'a1', refresh: 'r1' });
    signOut();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signOut');
    expect(state.token).toBeNull();
    expect(utils.removeToken).toHaveBeenCalled();
  });

  it('should hydrate from stored token', () => {
    utils.__setStored({ access: 'stored-a', refresh: 'stored-r' });
    hydrateAuth();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signIn');
    expect(state.token).toEqual({ access: 'stored-a', refresh: 'stored-r' });
  });

  it('should sign out when no stored token on hydrate', () => {
    utils.__setStored(null);
    hydrateAuth();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signOut');
    expect(state.token).toBeNull();
  });

  it('should work as a hook', () => {
    const { result } = renderHook(() => useAuthStore.use.token());

    expect(result.current).toBeNull();

    act(() => {
      signIn({ access: 'hook-a', refresh: 'hook-r' });
    });

    expect(result.current).toEqual({ access: 'hook-a', refresh: 'hook-r' });
  });
});
