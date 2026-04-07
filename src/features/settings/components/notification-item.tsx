import * as React from 'react';
import { Linking, Platform } from 'react-native';

import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  View,
} from '@/components/ui';
import { useNotifications } from '@/lib/notifications';

interface NotificationItemProps {
  isLast?: boolean;
}

export function NotificationItem({ isLast = false }: NotificationItemProps) {
  const { isEnabled, isLoading, requestPermission } = useNotifications();

  const handleToggle = async () => {
    if (isEnabled) {
      // Can't programmatically disable - open settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } else {
      await requestPermission();
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      className={`flex-row items-center justify-between px-4 py-3 ${
        !isLast ? 'border-b border-neutral-200 dark:border-neutral-700' : ''
      }`}
    >
      <View className="flex-1">
        <Text className="text-neutral-900 dark:text-neutral-100">
          Push Notifications
        </Text>
        <Text className="text-xs text-neutral-500">
          {isEnabled ? 'Enabled' : 'Get notified about new messages'}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Switch
          checked={isEnabled}
          onChange={handleToggle}
          accessibilityLabel="Toggle push notifications"
        />
      )}
    </Pressable>
  );
}
