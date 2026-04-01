import axios from 'axios';
import Env from 'env';
import { setupAuthInterceptor } from './interceptors/auth';
import { setupErrorTransformInterceptor } from './interceptors/error-transform';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
});

// Auth + error-transform interceptors are static (no React deps).
// Logging interceptor is wired in APIProvider (provider.tsx) via useEffect,
// because it needs the Logger instance from LoggingProvider context.
setupAuthInterceptor(client);
setupErrorTransformInterceptor(client);
