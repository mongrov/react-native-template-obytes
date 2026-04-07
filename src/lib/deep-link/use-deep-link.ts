import Env from 'env';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

export interface DeepLinkData {
  /** The raw URL that was received */
  url: string;
  /** The parsed path from the URL */
  path: string;
  /** The hostname (for universal links) */
  hostname: string | null;
  /** Query parameters */
  queryParams: Record<string, string>;
}

export interface UseDeepLinkResult {
  /** The last received deep link data */
  lastDeepLink: DeepLinkData | null;
  /** Create a deep link URL for the app */
  createLink: (path: string, params?: Record<string, string>) => string;
  /** Open a URL in the browser */
  openURL: (url: string) => Promise<void>;
  /** Check if a URL can be opened */
  canOpenURL: (url: string) => Promise<boolean>;
}

/**
 * Hook for handling deep links in the app.
 *
 * Supported URL formats:
 * - Custom scheme: obytesApp://chat/123
 * - Universal links: https://app.obytes.com/chat/123
 *
 * The hook automatically handles navigation when a deep link is received.
 */
export function useDeepLink(): UseDeepLinkResult {
  const router = useRouter();
  const [lastDeepLink, setLastDeepLink] = useState<DeepLinkData | null>(null);

  // Parse a URL into DeepLinkData
  const parseURL = useCallback((url: string): DeepLinkData | null => {
    try {
      const parsed = Linking.parse(url);

      return {
        url,
        path: parsed.path || '',
        hostname: parsed.hostname,
        queryParams: (parsed.queryParams || {}) as Record<string, string>,
      };
    } catch {
      console.error('Failed to parse deep link URL:', url);
      return null;
    }
  }, []);

  // Handle an incoming URL
  const handleURL = useCallback(
    (url: string) => {
      const data = parseURL(url);
      if (!data) return;

      setLastDeepLink(data);

      // Let expo-router handle the navigation
      // It will automatically match the path to the correct screen
      if (data.path) {
        router.push(data.path as never);
      }
    },
    [parseURL, router]
  );

  // Create a deep link URL
  const createLink = useCallback(
    (path: string, params?: Record<string, string>): string => {
      const scheme = Env.EXPO_PUBLIC_SCHEME;
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      return `${scheme}://${path}${queryString}`;
    },
    []
  );

  // Open a URL
  const openURL = useCallback(async (url: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open URL:', url, err);
    }
  }, []);

  // Check if a URL can be opened
  const canOpenURL = useCallback(async (url: string): Promise<boolean> => {
    return Linking.canOpenURL(url);
  }, []);

  // Handle initial URL (when app is opened via deep link)
  useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleURL(url);
      }
    };

    getInitialURL();
  }, [handleURL]);

  // Listen for incoming URLs while app is running
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      handleURL(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleURL]);

  return {
    lastDeepLink,
    createLink,
    openURL,
    canOpenURL,
  };
}
