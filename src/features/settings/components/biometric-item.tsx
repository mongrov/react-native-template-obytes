/**
 * Biometric Lock Settings Item
 *
 * Toggle to enable/disable biometric lock for the app.
 */

import * as React from 'react';
import { Switch } from 'react-native';

import { colors, Pressable, Text, View } from '@/components/ui';
import { useBiometricLock } from '@/lib/auth';
import { useColorScheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface BiometricItemProps {
  isLast?: boolean;
}

export function BiometricItem({ isLast = false }: BiometricItemProps) {
  const { isAvailable, isEnabled, enable, disable, isAuthenticating } = useBiometricLock();
  const { isDark } = useColorScheme();

  // Don't show if biometric hardware isn't available
  if (!isAvailable) {
    return null;
  }

  const handleToggle = async (value: boolean) => {
    if (value) {
      await enable();
    } else {
      disable();
    }
  };

  return (
    <Pressable
      disabled={isAuthenticating}
      className={cn(
        'flex-row items-center justify-between px-4 py-3',
        !isLast && 'border-b border-neutral-200 dark:border-neutral-700',
        isAuthenticating && 'opacity-50'
      )}
    >
      <View className="flex-1">
        <Text>Biometric Lock</Text>
        <Text variant="muted" className="text-xs">
          Require Face ID / Touch ID to unlock app
        </Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        disabled={isAuthenticating}
        trackColor={{
          false: isDark ? colors.neutral[600] : colors.neutral[300],
          true: colors.primary[500],
        }}
        thumbColor={isDark ? colors.neutral[200] : colors.white}
      />
    </Pressable>
  );
}
