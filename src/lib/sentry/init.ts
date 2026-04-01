import * as Sentry from '@sentry/react-native';

export function initSentry(
  dsn: string,
  options?: Partial<Sentry.ReactNativeOptions>,
) {
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    ...options,
  });
}
