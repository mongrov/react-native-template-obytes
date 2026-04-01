import axios from 'axios';
import Env from 'env';
import { setupErrorTransformInterceptor } from './interceptors/error-transform';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
});

// Static interceptors (no React deps).
// Auth + logging interceptors are wired in APIProvider (provider.tsx) via useEffect.
setupErrorTransformInterceptor(client);
