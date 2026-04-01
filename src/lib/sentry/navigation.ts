import * as Sentry from '@sentry/react-native';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';

export function useSentryScreenTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        level: 'info',
      });
    }
  }, [pathname]);
}
