import type { Logger } from '@mongrov/core';
import type { AxiosInstance } from 'axios';

/**
 * Attaches request/response logging interceptors to an Axios instance.
 * Returns a cleanup function that ejects the interceptors.
 */
export function setupLoggingInterceptor(
  api: AxiosInstance,
  logger: Logger,
): () => void {
  // Request logging
  const reqId = api.interceptors.request.use((config) => {
    (config as any)._startTime = Date.now();
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
    });
    return config;
  });

  // Response logging
  const resId = api.interceptors.response.use(
    (response) => {
      const duration = Date.now() - ((response.config as any)._startTime ?? 0);
      logger.debug('API Response', {
        status: response.status,
        url: response.config.url,
        duration,
      });
      return response;
    },
    (error) => {
      const duration = Date.now() - ((error.config as any)?._startTime ?? 0);
      logger.error('API Error', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        duration,
      });
      return Promise.reject(error);
    },
  );

  return () => {
    api.interceptors.request.eject(reqId);
    api.interceptors.response.eject(resId);
  };
}
