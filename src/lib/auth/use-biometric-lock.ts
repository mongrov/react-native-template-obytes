/**
 * Biometric Lock Hook
 *
 * Manages biometric authentication state for app lock functionality.
 * Users can enable biometric lock to require Face ID/Touch ID when
 * returning to the app.
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useBiometricGate } from '@mongrov/auth';

import { useAuth } from './index';
import { getItem, setItem, removeItem } from '../storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_lock_enabled';
const LAST_BACKGROUND_KEY = 'last_background_time';
const LOCK_TIMEOUT_MS = 30000; // 30 seconds - require auth if backgrounded longer

export interface UseBiometricLockResult {
  /** Whether biometric hardware is available on device */
  isAvailable: boolean;
  /** Whether biometric lock is enabled by user */
  isEnabled: boolean;
  /** Whether the app is currently locked */
  isLocked: boolean;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Last authentication error */
  error: string | null;
  /** Enable biometric lock */
  enable: () => Promise<boolean>;
  /** Disable biometric lock */
  disable: () => void;
  /** Attempt to unlock with biometrics */
  unlock: () => Promise<boolean>;
}

export function useBiometricLock(): UseBiometricLockResult {
  const { status } = useAuth();
  const biometric = useBiometricGate();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load enabled state from storage on mount
  useEffect(() => {
    const loadEnabledState = async () => {
      const enabled = getItem<boolean>(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled ?? false);
    };
    loadEnabledState();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    if (!isEnabled || status !== 'authenticated') {
      return;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Record when we went to background
        setItem(LAST_BACKGROUND_KEY, Date.now());
      } else if (nextState === 'active') {
        // Check if we should lock
        const lastBackground = getItem<number>(LAST_BACKGROUND_KEY);
        if (lastBackground) {
          const elapsed = Date.now() - lastBackground;
          if (elapsed > LOCK_TIMEOUT_MS) {
            setIsLocked(true);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isEnabled, status]);

  // Auto-unlock if user logs out
  useEffect(() => {
    if (status !== 'authenticated') {
      setIsLocked(false);
    }
  }, [status]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!biometric.isAvailable) {
      return false;
    }

    // Verify biometric works before enabling
    setIsAuthenticating(true);
    const success = await biometric.authenticate('Verify to enable biometric lock');
    setIsAuthenticating(false);

    if (success) {
      setItem(BIOMETRIC_ENABLED_KEY, true);
      setIsEnabled(true);
      return true;
    }

    return false;
  }, [biometric]);

  const disable = useCallback(() => {
    removeItem(BIOMETRIC_ENABLED_KEY);
    removeItem(LAST_BACKGROUND_KEY);
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!isLocked) {
      return true;
    }

    setIsAuthenticating(true);
    const success = await biometric.authenticate('Unlock app');
    setIsAuthenticating(false);

    if (success) {
      setIsLocked(false);
      removeItem(LAST_BACKGROUND_KEY);
      return true;
    }

    return false;
  }, [biometric, isLocked]);

  return {
    isAvailable: biometric.isAvailable,
    isEnabled,
    isLocked,
    isAuthenticating,
    error: biometric.error,
    enable,
    disable,
    unlock,
  };
}
