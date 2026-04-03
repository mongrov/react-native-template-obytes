import type { SocialProvider } from '@mongrov/auth';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './index';

// Ensure web browser dismisses properly on web
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth configuration for a provider.
 */
export type OAuthConfig = {
  /** OAuth client ID */
  clientId: string;
  /** OAuth scopes to request */
  scopes?: string[];
  /** Custom authorization endpoint (for SSO/OIDC) */
  authorizationEndpoint?: string;
  /** Custom token endpoint (for SSO/OIDC) */
  tokenEndpoint?: string;
  /** Redirect URI (auto-generated if not provided) */
  redirectUri?: string;
};

/**
 * SSO/OIDC configuration.
 */
export type SSOConfig = {
  /** OIDC issuer URL (e.g., https://company.okta.com) */
  issuer: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth scopes to request */
  scopes?: string[];
};

/**
 * Result of an OAuth flow.
 */
export type OAuthResult = {
  /** Whether the flow is in progress */
  loading: boolean;
  /** Error message if flow failed */
  error: string | null;
  /** Start the OAuth flow */
  promptAsync: () => Promise<void>;
};

// Default scopes for social providers
const DEFAULT_SCOPES: Record<SocialProvider, string[]> = {
  google: ['openid', 'profile', 'email'],
  apple: ['name', 'email'],
  github: ['read:user', 'user:email'],
};

// Discovery documents for social providers
const PROVIDER_DISCOVERY: Record<SocialProvider, AuthSession.DiscoveryDocument> = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  },
  apple: {
    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    tokenEndpoint: 'https://appleid.apple.com/auth/token',
  },
  github: {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
  },
};

/**
 * Hook for social OAuth login (Google, Apple, GitHub).
 *
 * Usage:
 * ```tsx
 * const { loading, error, promptAsync } = useSocialAuth('google', {
 *   clientId: 'your-google-client-id',
 * });
 *
 * <SocialLoginButton
 *   provider="google"
 *   onPress={promptAsync}
 *   loading={loading}
 * />
 * ```
 */
export function useSocialAuth(
  provider: SocialProvider,
  config: OAuthConfig,
): OAuthResult {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discovery = PROVIDER_DISCOVERY[provider];
  const scopes = config.scopes ?? DEFAULT_SCOPES[provider];

  const redirectUri
    = config.redirectUri ?? AuthSession.makeRedirectUri({ scheme: 'obytesapp' });

  const [request, response, promptAsyncInternal] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  // Handle the OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthCode(code);
    }
    else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Authentication failed');
      setLoading(false);
    }
    else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleAuthCode = async (code: string) => {
    try {
      // Exchange code for tokens via your backend
      // The adapter should handle the token exchange
      await signIn({
        provider,
        code,
        redirectUri,
      });
      setError(null);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
    finally {
      setLoading(false);
    }
  };

  const promptAsync = useCallback(async () => {
    if (!request) {
      setError('OAuth request not ready');
      return;
    }
    setLoading(true);
    setError(null);
    await promptAsyncInternal();
  }, [request, promptAsyncInternal]);

  return { loading, error, promptAsync };
}

/**
 * Hook for SSO/OIDC login (Okta, Azure AD, etc.).
 *
 * Usage:
 * ```tsx
 * const { loading, error, promptAsync } = useSSOAuth({
 *   issuer: 'https://company.okta.com',
 *   clientId: 'your-client-id',
 * });
 *
 * <SSOButton
 *   onPress={promptAsync}
 *   loading={loading}
 *   providerName="Okta"
 * />
 * ```
 */
export function useSSOAuth(config: SSOConfig): OAuthResult {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<AuthSession.DiscoveryDocument | null>(null);

  const scopes = config.scopes ?? ['openid', 'profile', 'email'];
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'obytesapp' });

  // Fetch OIDC discovery document
  useEffect(() => {
    AuthSession.fetchDiscoveryAsync(config.issuer)
      .then(setDiscovery)
      .catch((err) => {
        setError(`Failed to fetch OIDC config: ${err.message}`);
      });
  }, [config.issuer]);

  const [request, response, promptAsyncInternal] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  // Handle the OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthCode(code);
    }
    else if (response?.type === 'error') {
      setError(response.error?.message ?? 'SSO authentication failed');
      setLoading(false);
    }
    else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleAuthCode = async (code: string) => {
    try {
      // Exchange code for tokens via your backend
      await signIn({
        provider: 'sso',
        code,
        redirectUri,
        issuer: config.issuer,
      });
      setError(null);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'SSO authentication failed');
    }
    finally {
      setLoading(false);
    }
  };

  const promptAsync = useCallback(async () => {
    if (!request || !discovery) {
      setError('SSO not ready - waiting for OIDC discovery');
      return;
    }
    setLoading(true);
    setError(null);
    await promptAsyncInternal();
  }, [request, discovery, promptAsyncInternal]);

  return { loading, error, promptAsync };
}

/**
 * Combined hook that returns auth methods based on tenant config.
 *
 * Usage:
 * ```tsx
 * const { socialAuth, ssoAuth } = useOAuthFlow(tenant?.auth);
 *
 * // Use socialAuth.google.promptAsync, socialAuth.apple.promptAsync, etc.
 * // Use ssoAuth.promptAsync for SSO
 * ```
 */
export function useOAuthFlow(authConfig?: {
  method: string;
  providers?: SocialProvider[];
  provider?: string;
  issuer?: string;
  clientId?: string;
  scopes?: string[];
}) {
  // This is a placeholder - in a real app, you'd configure these
  // client IDs via environment variables or tenant config
  const socialConfigs: Partial<Record<SocialProvider, OAuthConfig>> = {
    // Configure these in your app
    // google: { clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID! },
    // apple: { clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID! },
    // github: { clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID! },
  };

  const ssoConfig: SSOConfig | null
    = authConfig?.method === 'sso' && authConfig.issuer && authConfig.clientId
      ? {
          issuer: authConfig.issuer,
          clientId: authConfig.clientId,
          scopes: authConfig.scopes,
        }
      : null;

  return {
    socialConfigs,
    ssoConfig,
    // Individual hooks should be called in components that need them
    // This hook just provides the configuration
  };
}
