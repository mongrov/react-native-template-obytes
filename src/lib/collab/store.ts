import { create } from 'zustand';

import { kvStore } from '@/lib/storage';

const TOKEN_KEY = 'collab:authToken';
const USER_ID_KEY = 'collab:userId';

export type CollabAuthState = {
  authToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setCredentials: (token: string, userId: string) => void;
  clearCredentials: () => void;
  hydrate: () => Promise<void>;
};

export const useCollabStore = create<CollabAuthState>(set => ({
  authToken: null,
  userId: null,
  isAuthenticated: false,

  setCredentials: (token: string, userId: string) => {
    kvStore.set(TOKEN_KEY, token);
    kvStore.set(USER_ID_KEY, userId);
    set({ authToken: token, userId, isAuthenticated: true });
  },

  clearCredentials: () => {
    kvStore.delete(TOKEN_KEY);
    kvStore.delete(USER_ID_KEY);
    set({ authToken: null, userId: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = await kvStore.get(TOKEN_KEY);
    const userId = await kvStore.get(USER_ID_KEY);
    if (token && userId) {
      set({ authToken: token, userId, isAuthenticated: true });
    }
  },
}));
