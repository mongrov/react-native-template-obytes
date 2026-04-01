import type { AxiosInstance } from 'axios';
import { signOut } from '@/features/auth/use-auth-store';
import { tokenStore } from '@/lib/auth/secure-token';

export function setupAuthInterceptor(api: AxiosInstance) {
  // Request: attach Authorization header
  api.interceptors.request.use(async (config) => {
    const token = await tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response: on 401, attempt refresh then retry
  api.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await tokenStore.getRefresh();
          if (!refreshToken) {
            signOut();
            return Promise.reject(error);
          }

          // Attempt token refresh
          const response = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          await tokenStore.set(access_token);
          if (refresh_token) {
            await tokenStore.setRefresh(refresh_token);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
        catch {
          signOut();
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
}
