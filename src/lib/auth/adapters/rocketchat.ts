import type { AuthAdapter, AuthTokens } from '@mongrov/auth';

import axios from 'axios';

/**
 * Rocket.Chat authentication adapter.
 *
 * Rocket.Chat uses REST API for authentication. This adapter handles:
 * - Email/password login via /api/v1/login
 * - OAuth login via /api/v1/login (with OAuth token)
 * - Token-based authentication
 *
 * Usage:
 * ```ts
 * import { createRocketChatAdapter } from '@/lib/auth/adapters/rocketchat';
 *
 * const adapter = createRocketChatAdapter({
 *   baseUrl: 'https://your-rocketchat.com',
 * });
 * ```
 */
export type RocketChatAdapterConfig = {
  /** Rocket.Chat server URL (e.g., https://chat.company.com) */
  baseUrl: string;
  /** Optional: timeout in milliseconds */
  timeout?: number;
};

type RocketChatUser = {
  _id: string;
  username: string;
  name: string;
  emails: Array<{ address: string; verified: boolean }>;
  status: string;
  roles: string[];
};

type RocketChatLoginResponse = {
  status: 'success' | 'error';
  data?: {
    userId: string;
    authToken: string;
    me: RocketChatUser;
  };
  error?: string;
  message?: string;
};

type RocketChatMeResponse = {
  _id: string;
  username: string;
  name: string;
  emails: Array<{ address: string; verified: boolean }>;
  status: string;
  roles: string[];
};

// eslint-disable-next-line max-lines-per-function
export function createRocketChatAdapter(config: RocketChatAdapterConfig): AuthAdapter {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout ?? 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let currentAuthToken: string | null = null;
  let currentUserId: string | null = null;

  /**
   * Create a JWT-like token from Rocket.Chat credentials.
   * This allows the auth data to work with @mongrov/auth's token-based flow.
   */
  function createToken(userId: string, authToken: string, user: RocketChatUser): string {
    const payload = {
      sub: userId,
      email: user.emails?.[0]?.address ?? user.username,
      name: user.name,
      username: user.username,
      roles: user.roles,
      auth_token: authToken, // Store for API calls
      iat: Math.floor(Date.now() / 1000),
      // Rocket.Chat tokens don't expire by default, but we set a reasonable expiry
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.rc`;
  }

  /**
   * Extract auth credentials from our custom token.
   */
  function parseToken(token: string): { userId: string; authToken: string } | null {
    try {
      const [, body] = token.split('.');
      const payload = JSON.parse(atob(body));
      return {
        userId: payload.sub,
        authToken: payload.auth_token,
      };
    }
    catch {
      return null;
    }
  }

  return {
    async login(credentials): Promise<AuthTokens> {
      const { email, password, provider, code } = credentials as {
        email?: string;
        password?: string;
        provider?: string;
        code?: string;
      };

      let response: RocketChatLoginResponse;

      if (provider && code) {
        // OAuth login
        response = await client
          .post<RocketChatLoginResponse>('/api/v1/login', {
            serviceName: provider,
            accessToken: code,
          })
          .then(r => r.data);
      }
      else if (email && password) {
        // Email/password login
        response = await client
          .post<RocketChatLoginResponse>('/api/v1/login', {
            user: email,
            password,
          })
          .then(r => r.data);
      }
      else {
        throw new Error('Invalid credentials');
      }

      if (response.status !== 'success' || !response.data) {
        throw new Error(response.message ?? response.error ?? 'Login failed');
      }

      const { userId, authToken, me } = response.data;
      currentAuthToken = authToken;
      currentUserId = userId;

      // Create a token that can be decoded by @mongrov/auth
      const accessToken = createToken(userId, authToken, me);

      return {
        accessToken,
        refreshToken: authToken, // Use authToken as refresh token
        expiresIn: 30 * 24 * 60 * 60, // 30 days
      };
    },

    async refresh(refreshToken): Promise<AuthTokens> {
      // Parse the stored credentials
      let parsedCreds = parseToken(refreshToken);

      // If parsing failed, refreshToken might be the raw authToken
      if (!parsedCreds) {
        if (!currentUserId) {
          throw new Error('Session expired');
        }
        parsedCreds = {
          authToken: refreshToken,
          userId: currentUserId,
        };
      }

      const { authToken, userId } = parsedCreds;

      // Verify the token is still valid by getting user info
      try {
        const response = await client.get<RocketChatMeResponse>('/api/v1/me', {
          headers: {
            'X-Auth-Token': authToken,
            'X-User-Id': userId,
          },
        });

        const user = response.data;
        currentAuthToken = authToken;
        currentUserId = userId;

        const accessToken = createToken(userId, authToken, {
          _id: user._id,
          username: user.username,
          name: user.name,
          emails: user.emails,
          status: user.status,
          roles: user.roles,
        });

        return {
          accessToken,
          refreshToken: authToken,
          expiresIn: 30 * 24 * 60 * 60,
        };
      }
      catch {
        throw new Error('Session expired - please log in again');
      }
    },

    async logout(): Promise<void> {
      if (currentAuthToken && currentUserId) {
        try {
          await client.post(
            '/api/v1/logout',
            {},
            {
              headers: {
                'X-Auth-Token': currentAuthToken,
                'X-User-Id': currentUserId,
              },
            },
          );
        }
        catch {
          // Ignore logout errors
        }
      }
      currentAuthToken = null;
      currentUserId = null;
    },
  };
}

/**
 * Helper to create an authenticated Axios client for Rocket.Chat API calls.
 */
export function createRocketChatClient(
  baseUrl: string,
  accessToken: string,
): ReturnType<typeof axios.create> {
  // Extract auth credentials from our token
  const [, body] = accessToken.split('.');
  const payload = JSON.parse(atob(body));

  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': payload.auth_token,
      'X-User-Id': payload.sub,
    },
  });
}
