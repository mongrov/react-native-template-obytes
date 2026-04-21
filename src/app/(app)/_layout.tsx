import { Redirect, SplashScreen } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { BiometricLockScreen } from '@/features/auth/components/biometric-lock-screen';
import { useAuth, useBiometricLock } from '@/lib/auth';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

/**
 * Auth gate + onboarding redirect. Default signed-in destination is `/task-list`.
 * Tab screens under `(app)/` remain available for future navigation (e.g. `router.push('/(app)/settings')`).
 */
export default function AppGateLayout() {
  const { isHydrated, isAuthenticated, status, signOut } = useAuth();
  const [isFirstTime] = useIsFirstTime();
  const biometricLock = useBiometricLock();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  if (isFirstTime) {
    SplashScreen.hideAsync();
    return <Redirect href="/onboarding" />;
  }

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    SplashScreen.hideAsync();
    return <Redirect href="/login" />;
  }

  if (biometricLock.isLocked) {
    return (
      <BiometricLockScreen
        onUnlock={biometricLock.unlock}
        isAuthenticating={biometricLock.isAuthenticating}
        error={biometricLock.error}
        onSignOut={signOut}
      />
    );
  }

  return <Redirect href="/task-list" />;
}
