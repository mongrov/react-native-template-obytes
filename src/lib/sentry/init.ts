// Lazy-load @sentry/react-native to avoid crashes in Expo Go
// where the native module isn't available.
let Sentry: typeof import('@sentry/react-native') | null = null;
try {
  Sentry = require('@sentry/react-native');
}
catch {
  // Native module not available (e.g., Expo Go)
}

export function initSentry(
  dsn: string,
  options?: Partial<import('@sentry/react-native').ReactNativeOptions>,
) {
  if (!Sentry)
    return;
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    ...options,
  });
}
