import type { LogEntry, LogTransport } from '@mongrov/core';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AIProvider } from '@mongrov/ai';
import { AuthProvider } from '@mongrov/auth';
import { LoggingProvider } from '@mongrov/core';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import Env from 'env';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { KeyboardProvider } from 'react-native-keyboard-controller';
import { aiConfig } from '@/lib/ai';
import { APIProvider } from '@/lib/api';
import { authConfig } from '@/lib/auth';
import { initSentry, SentryErrorBoundary } from '@/lib/sentry';
import { useColorScheme, useNavigationTheme } from '@/lib/theme';
// Import  global CSS file
import '../global.css';
// Lazy-load Sentry to avoid crashes in Expo Go
type SentryModule = typeof import('@sentry/react-native');
let Sentry: SentryModule | null = null;
try {
  Sentry = require('@sentry/react-native');
}
catch {
  // Native module not available
}

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(app)',
};

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

// Custom transport that forwards warn/error entries to Sentry as breadcrumbs
const sentryBreadcrumbTransport: LogTransport = {
  name: 'sentry-breadcrumbs',
  send: async (entries: LogEntry[]) => {
    if (!Sentry)
      return;
    for (const entry of entries) {
      if (entry.level === 'warn' || entry.level === 'error') {
        Sentry.addBreadcrumb({
          message: entry.message,
          level: entry.level as 'info' | 'warning' | 'error' | 'debug',
          data: entry.data,
        });
      }
    }
  },
};

function Providers({ children }: { children: React.ReactNode }) {
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
          transports: Sentry ? [sentryBreadcrumbTransport] : [],
          onException: (error, context) => {
            Sentry?.captureException(error, { extra: context });
          },
        }}
      >
        <InnerProviders>
          {children}
        </InnerProviders>
      </LoggingProvider>
    </SentryErrorBoundary>
  );
}

/** Inner providers that need hooks (useNavigationTheme, useColorScheme) */
function InnerProviders({ children }: { children: React.ReactNode }) {
  const navTheme = useNavigationTheme();
  const { isDark } = useColorScheme();

  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={isDark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <NavThemeProvider value={navTheme}>
          <AuthProvider config={authConfig}>
            {aiConfig
              ? (
                  <AIProvider config={aiConfig}>
                    <APIProvider>
                      <BottomSheetModalProvider>
                        {children}
                        <FlashMessage position="top" />
                      </BottomSheetModalProvider>
                    </APIProvider>
                  </AIProvider>
                )
              : (
                  <APIProvider>
                    <BottomSheetModalProvider>
                      {children}
                      <FlashMessage position="top" />
                    </BottomSheetModalProvider>
                  </APIProvider>
                )}
          </AuthProvider>
        </NavThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
