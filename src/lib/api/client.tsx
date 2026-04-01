import axios from 'axios';
import Env from 'env';
import { setupAuthInterceptor } from './interceptors/auth';
import { setupErrorTransformInterceptor } from './interceptors/error-transform';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
});

// Setup interceptors
setupAuthInterceptor(client);
setupErrorTransformInterceptor(client);

// Logging interceptor is wired up in APIProvider (provider.tsx)
// which has access to the Logger instance from LoggingProvider context.
