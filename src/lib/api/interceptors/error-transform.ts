import type { AxiosInstance } from 'axios';

export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export function setupErrorTransformInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    response => response,
    (error) => {
      if (error.response) {
        const { data, status } = error.response;
        const message
          = data?.message ?? data?.error ?? error.message ?? 'Unknown error';
        const code = data?.code ?? data?.error_code;

        return Promise.reject(new AppError(message, status, code));
      }

      // Network error (no response)
      return Promise.reject(
        new AppError(error.message ?? 'Network error', 0, 'NETWORK_ERROR'),
      );
    },
  );
}
