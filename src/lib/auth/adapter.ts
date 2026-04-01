import type { AuthAdapter } from '@mongrov/auth';

// App implements its own adapter — swap for real backend calls
export const authAdapter: AuthAdapter = {
  login: async (credentials) => {
    // Demo: return fake tokens (same as current template behavior)
    // Replace with real API call, e.g.:
    //   const res = await client.post('/auth/login', credentials);
    //   return { accessToken: res.data.access_token, ... };
    const email = (credentials as { email?: string }).email ?? 'demo@test.com';
    return {
      accessToken: makeDemoJwt({ sub: '1', email, name: 'Demo User' }),
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };
  },
  refresh: async (_refreshToken) => {
    // Demo: return fake tokens
    // Replace with real API call, e.g.:
    //   const res = await client.post('/auth/refresh', { token: refreshToken });
    return {
      accessToken: makeDemoJwt({ sub: '1', email: 'demo@test.com', name: 'Demo User' }),
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };
  },
  logout: async () => {
    // No-op for demo
  },
};

/** Create a minimal valid JWT for demo purposes (not cryptographically signed). */
function makeDemoJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `${header}.${body}.`;
}
