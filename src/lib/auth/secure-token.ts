import * as SecureStore from 'expo-secure-store';

export const tokenStore = {
  get: () => SecureStore.getItemAsync('auth_token'),
  set: (token: string) => SecureStore.setItemAsync('auth_token', token),
  getRefresh: () => SecureStore.getItemAsync('refresh_token'),
  setRefresh: (token: string) => SecureStore.setItemAsync('refresh_token', token),
  clear: () =>
    Promise.all([
      SecureStore.deleteItemAsync('auth_token'),
      SecureStore.deleteItemAsync('refresh_token'),
    ]),
};
