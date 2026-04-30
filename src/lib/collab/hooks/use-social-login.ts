import { useAppleAuth, useGoogleAuth } from '@mongrov/auth';
import Env from 'env';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useState } from 'react';

import { socialLoginViaRest } from '../auth';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SocialLoginState = {
  isLoading: boolean;
  error: string | null;
};

export type UseSocialLoginResult = {
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

function assertGoogleConfigured() {
  if (!Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID && !Env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google Sign-In is not configured (missing Google client id env vars)');
  }
}

function decodeAppleEmail(identityToken: string | undefined, fallbackEmail: string) {
  if (fallbackEmail)
    return fallbackEmail;
  if (!identityToken)
    return '';
  try {
    const decoded = jwtDecode<{ email?: string }>(identityToken);
    return decoded.email ?? '';
  }
  catch {
    return '';
  }
}

function buildGoogleSocialData(result: { accessToken: string; idToken: string }) {
  return {
    serviceName: 'google' as const,
    accessToken: result.accessToken,
    idToken: result.idToken,
    expiresIn: 2000,
    scope: 'profile',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Handles the Ziva social login flow.
 * Step 1: useGoogleAuth / useAppleAuth from @mongrov/auth to get social tokens
 * Step 2: socialLoginViaRest → POST /api/v1/login → returns authToken + userId
 * Step 3: collabStore.setCredentials (done inside socialLoginViaRest on success)
 *
 * Ported from ziva_app Login.tsx L44–205
 */
export function useSocialLogin(): UseSocialLoginResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleAuth = useGoogleAuth({
    webClientId: Env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  const appleAuth = useAppleAuth();

  const clearError = useCallback(() => setError(null), []);

  // ── Google login ──────────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // If build-time config skipped Google Sign-In (or env isn't present), fail loudly.
      // Otherwise the underlying hook may just return null and store details in googleAuth.error.
      assertGoogleConfigured();

      const result = await googleAuth.signIn();
      if (!result) {
        // Can be user cancel, or a sign-in failure reported via googleAuth.error
        if (googleAuth.error?.message) {
          throw new Error(googleAuth.error.message);
        }
        return false;
      }

      const socialData = buildGoogleSocialData(result);

      const response = await socialLoginViaRest(socialData);
      if (response.status !== 'success') {
        throw new Error(response.message ?? response.error ?? 'Collab login failed');
      }

      return true;
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Google login failed';
      setError(msg);
      return false;
    }
    finally {
      setIsLoading(false);
    }
  }, [googleAuth]);

  // ── Apple login ───────────────────────────────────────────────────────────

  const loginWithApple = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await appleAuth.signIn();
      if (!result) {
        // User cancelled — not an error
        return false;
      }

      // Decode identity token to extract email if Apple didn't provide it
      const email = decodeAppleEmail(result.identityToken, result.user?.email ?? '');

      const socialData = {
        serviceName: 'apple' as const,
        identityToken: result.identityToken,
        email,
        fullName: result.user?.fullName
          ? {
              givenName: result.user.fullName.givenName ?? null,
              familyName: result.user.fullName.familyName ?? null,
            }
          : undefined,
      };

      const response = await socialLoginViaRest(socialData);
      if (response.status !== 'success') {
        throw new Error(response.message ?? response.error ?? 'Collab login failed');
      }

      return true;
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Apple login failed';
      setError(msg);
      return false;
    }
    finally {
      setIsLoading(false);
    }
  }, [appleAuth]);

  return {
    loginWithGoogle,
    loginWithApple,
    isLoading: isLoading || googleAuth.loading || appleAuth.loading,
    error,
    clearError,
  };
}
