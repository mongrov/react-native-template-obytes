import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LoggingProvider } from '@mongrov/core';
import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import Env from 'env';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { hydrateAuth } from '@/features/auth/use-auth-store';

import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { initSentry, SentryErrorBoundary } from '@/lib/sentry';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(app)',
};

hydrateAuth();
loadSelectedTheme();

// Initialize Sentry
if (Env.EXPO_PUBLIC_SENTRY_DSN) {
  initSentry(Env.EXPO_PUBLIC_SENTRY_DSN);
}
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();

  const webhookHeaders = Env.EXPO_PUBLIC_LOG_WEBHOOK_HEADERS
    ? JSON.parse(Env.EXPO_PUBLIC_LOG_WEBHOOK_HEADERS) as Record<string, string>
    : undefined;

  return (
    <SentryErrorBoundary>
      <LoggingProvider
        config={{
          appVersion: Env.EXPO_PUBLIC_VERSION,
          minLevel: Env.EXPO_PUBLIC_LOG_LEVEL,
          ringBuffer: true,
          file: true,
          webhook: Env.EXPO_PUBLIC_LOG_WEBHOOK_URL
            ? {
                url: Env.EXPO_PUBLIC_LOG_WEBHOOK_URL,
                headers: webhookHeaders,
              }
            : undefined,
          onLog: (entry) => {
            Sentry.addBreadcrumb({
              message: entry.message,
              level: entry.level as Sentry.SeverityLevel,
              data: entry.data,
            });
          },
          onException: (error, context) => {
            Sentry.captureException(error, { extra: context });
          },
        }}
      >
        <GestureHandlerRootView
          style={styles.container}
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className={theme.dark ? `dark` : undefined}
        >
          <KeyboardProvider>
            <ThemeProvider value={theme}>
              <APIProvider>
                <BottomSheetModalProvider>
                  {children}
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              </APIProvider>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </LoggingProvider>
    </SentryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
