import Env from 'env';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type?: 'chat' | 'message' | 'general';
  conversationId?: string;
  messageId?: string;
  [key: string]: unknown;
}

export interface ScheduleNotificationOptions {
  title: string;
  body: string;
  data?: NotificationData;
  trigger?: Notifications.NotificationTriggerInput;
}

export interface UseNotificationsResult {
  /** The Expo push token for this device */
  expoPushToken: string | null;
  /** Whether notifications are enabled */
  isEnabled: boolean;
  /** Whether we're still loading permission status */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Request permission and register for push notifications */
  requestPermission: () => Promise<boolean>;
  /** Schedule a local notification */
  scheduleLocalNotification: (options: ScheduleNotificationOptions) => Promise<string>;
  /** Cancel a scheduled notification */
  cancelNotification: (id: string) => Promise<void>;
  /** Cancel all scheduled notifications */
  cancelAllNotifications: () => Promise<void>;
  /** Get the current badge count */
  getBadgeCount: () => Promise<number>;
  /** Set the badge count */
  setBadgeCount: (count: number) => Promise<void>;
}

const PUSH_TOKEN_KEY = 'notifications.push_token';

// Helper function to register for push notifications (outside hook to avoid hoisting issues)
async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });

      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        description: 'Notifications for new chat messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Env.EXPO_PUBLIC_PROJECT_ID,
    });

    return tokenData.data;
  } catch (err) {
    console.error('Failed to get push token:', err);
    return null;
  }
}

export function useNotifications(): UseNotificationsResult {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListenerRef = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListenerRef = useRef<Notifications.EventSubscription | undefined>(undefined);

  // Handle notification tap - navigate to appropriate screen
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      if (data?.type === 'chat' || data?.type === 'message') {
        if (data.conversationId) {
          router.push(`/chat/${data.conversationId}`);
        } else {
          router.push('/chat');
        }
      }
    },
    [router]
  );

  // Check current permission status
  const checkPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsEnabled(status === 'granted');
    return status === 'granted';
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (!Device.isDevice) {
        setError('Push notifications require a physical device');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setIsEnabled(false);
        return false;
      }

      setIsEnabled(true);

      // Get push token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        storage.set(PUSH_TOKEN_KEY, token);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    }
  }, []);

  // Schedule a local notification
  const scheduleLocalNotification = useCallback(
    async (options: ScheduleNotificationOptions): Promise<string> => {
      const { title, body, data, trigger } = options;
      return Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: trigger ?? null,
      });
    },
    []
  );

  // Cancel a specific notification
  const cancelNotification = useCallback(async (id: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // Get badge count
  const getBadgeCount = useCallback(async (): Promise<number> => {
    return Notifications.getBadgeCountAsync();
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // Check existing permission
      const hasPermission = await checkPermission();

      // Load saved token
      const savedToken = storage.getString(PUSH_TOKEN_KEY);
      if (savedToken) {
        setExpoPushToken(savedToken);
      }

      // If we have permission but no token, try to get one
      if (hasPermission && !savedToken && Device.isDevice) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          storage.set(PUSH_TOKEN_KEY, token);
        }
      }

      setIsLoading(false);
    };

    init();

    // Listen for incoming notifications while app is foregrounded
    notificationListenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // You can handle foreground notifications here
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification taps
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      notificationListenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, [checkPermission, handleNotificationResponse]);

  return {
    expoPushToken,
    isEnabled,
    isLoading,
    error,
    requestPermission,
    scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}
