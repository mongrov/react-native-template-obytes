/**
 * Biometric Lock Screen
 *
 * Displayed when the app requires biometric authentication to unlock.
 * Shows after returning from background if biometric lock is enabled.
 */

import * as React from 'react';

import { Button, Text, View } from '@/components/ui';

interface BiometricLockScreenProps {
  /** Attempt to unlock with biometrics */
  onUnlock: () => Promise<boolean>;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Authentication error message */
  error: string | null;
  /** Optional: Sign out instead of unlocking */
  onSignOut?: () => void;
}

export function BiometricLockScreen({
  onUnlock,
  isAuthenticating,
  error,
  onSignOut,
}: BiometricLockScreenProps) {
  // Auto-trigger biometric prompt on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onUnlock();
    }, 500);
    return () => clearTimeout(timer);
  }, [onUnlock]);

  return (
    <View className="flex-1 items-center justify-center bg-white p-8 dark:bg-neutral-900">
      {/* Lock icon */}
      <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
        <Text className="text-5xl">🔒</Text>
      </View>

      <Text className="mb-2 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        App Locked
      </Text>

      <Text className="mb-8 text-center text-neutral-500 dark:text-neutral-400">
        Use Face ID or Touch ID to unlock
      </Text>

      {error && (
        <View className="mb-4 rounded-lg bg-red-100 px-4 py-2 dark:bg-red-900/30">
          <Text className="text-center text-red-600 dark:text-red-400">
            {error}
          </Text>
        </View>
      )}

      <Button
        label={isAuthenticating ? 'Authenticating...' : 'Unlock with Biometrics'}
        onPress={onUnlock}
        loading={isAuthenticating}
        className="mb-4 w-full"
      />

      {onSignOut && (
        <Button
          label="Sign Out Instead"
          variant="ghost"
          onPress={onSignOut}
          disabled={isAuthenticating}
          className="w-full"
        />
      )}
    </View>
  );
}
