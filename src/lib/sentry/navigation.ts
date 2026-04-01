import { usePathname } from 'expo-router';
import { useEffect } from 'react';

// Lazy-load Sentry to avoid crashes in Expo Go
let Sentry: typeof import('@sentry/react-native') | null = null;
try {
  Sentry = require('@sentry/react-native');
}
catch {
  // Native module not available
}

export function useSentryScreenTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && Sentry) {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        level: 'info',
      });
    }
  }, [pathname]);
}
