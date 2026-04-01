import { jwtDecode } from 'jwt-decode';

import { authAdapter } from '../adapter';

describe('authAdapter', () => {
  describe('login', () => {
    it('returns tokens with valid JWT accessToken', async () => {
      const result = await authAdapter.login({
        email: 'user@example.com',
        password: 'pass',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(3600);
    });

    it('produces a decodable JWT with correct claims', async () => {
      const result = await authAdapter.login({ email: 'alice@test.com' });
      const decoded = jwtDecode<Record<string, unknown>>(result.accessToken);

      expect(decoded.sub).toBe('1');
      expect(decoded.email).toBe('alice@test.com');
      expect(decoded.name).toBe('Demo User');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('uses default email when none provided', async () => {
      const result = await authAdapter.login({});
      const decoded = jwtDecode<Record<string, unknown>>(result.accessToken);

      expect(decoded.email).toBe('demo@test.com');
    });
  });

  describe('refresh', () => {
    it('returns tokens with valid JWT accessToken', async () => {
      const result = await authAdapter.refresh('old-refresh');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(3600);

      const decoded = jwtDecode<Record<string, unknown>>(result.accessToken);
      expect(decoded.sub).toBe('1');
    });
  });

  describe('logout', () => {
    it('resolves without error', async () => {
      await expect(authAdapter.logout!('some-token')).resolves.toBeUndefined();
    });
  });
});
