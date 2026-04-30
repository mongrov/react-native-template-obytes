import { Redirect, Stack } from 'expo-router';
import * as React from 'react';

import { useAuth } from '@/lib/auth';

export default function TaskListStackLayout() {
  const { isHydrated, isAuthenticated } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="bluetooth" />
      <Stack.Screen name="timon-data" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
