import type { TokenType } from '@/lib/auth/utils';

// Variables prefixed with `mock` are allowed in jest.mock factories
let mockStored: TokenType | null = null;

jest.mock('@/lib/auth/utils', () => ({
  getToken: jest.fn(() => mockStored),
  setToken: jest.fn((t: TokenType) => {
    mockStored = t;
  }),
  removeToken: jest.fn(() => {
    mockStored = null;
  }),
}));

// Must import AFTER mocks are set up

const { useAuthStore, hydrateAuth, signIn, signOut } = require('@/features/auth/use-auth-store');

const token: TokenType = { access: 'a.jwt.token', refresh: 'r.jwt.token' };

describe('useAuthStore', () => {
  beforeEach(() => {
    mockStored = null;
    // Reset zustand store to initial state
    useAuthStore.setState({ status: 'idle', token: null });
    jest.clearAllMocks();
  });

  it('should start with idle status and null token', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('idle');
    expect(state.token).toBeNull();
  });

  it('signIn should set token and status', () => {
    signIn(token);
    const state = useAuthStore.getState();
    expect(state.status).toBe('signIn');
    expect(state.token).toEqual(token);
  });

  it('signIn should persist token to storage', () => {
    const { setToken } = require('@/lib/auth/utils');
    signIn(token);
    expect(setToken).toHaveBeenCalledWith(token);
  });

  it('signOut should clear token and status', () => {
    signIn(token);
    signOut();
    const state = useAuthStore.getState();
    expect(state.status).toBe('signOut');
    expect(state.token).toBeNull();
  });

  it('signOut should remove token from storage', () => {
    const { removeToken } = require('@/lib/auth/utils');
    signIn(token);
    signOut();
    expect(removeToken).toHaveBeenCalled();
  });

  it('hydrate should sign in when token exists in storage', () => {
    mockStored = token;
    hydrateAuth();
    const state = useAuthStore.getState();
    expect(state.status).toBe('signIn');
    expect(state.token).toEqual(token);
  });

  it('hydrate should sign out when no token in storage', () => {
    mockStored = null;
    hydrateAuth();
    const state = useAuthStore.getState();
    expect(state.status).toBe('signOut');
    expect(state.token).toBeNull();
  });

  it('hydrate should sign out on storage error', () => {
    const { getToken } = require('@/lib/auth/utils');
    getToken.mockImplementationOnce(() => {
      throw new Error('corrupt');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    hydrateAuth();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
