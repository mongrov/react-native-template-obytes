import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { Text } from 'react-native';

import { BiometricLockScreen } from '@/features/auth/components/biometric-lock-screen';
import { useAuth, useBiometricLock } from '@/lib/auth';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

function RingIcon({ color }: { color?: string }) {
  return (
    <Text style={{ fontSize: 18, color: color ?? '#888' }}>💍</Text>
  );
}

export default function TabLayout() {
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <TabIcon symbol="💬" color={color} />,
          tabBarButtonTestID: 'chat-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon symbol="⚙️" color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
      <Tabs.Screen
        name="ring-debug"
        options={{
          title: 'Ring',
          headerShown: false,
          tabBarIcon: ({ color }) => <RingIcon color={color} />,
          tabBarButtonTestID: 'ring-debug-tab',
        }}
      />
    </Tabs>
  );
}
