/**
 * ZivaCollabProvider
 *
 * Wraps @mongrov/collab's CollabProvider with Ziva-specific auth.
 * Uses collabStore (authToken from RC REST login) instead of session.accessToken.
 * CollabProvider from @mongrov/collab owns the XState machine and reconnect logic.
 */

import type { CollabConfig } from '@mongrov/collab';
import { CollabProvider, useCollab } from '@mongrov/collab';

import * as React from 'react';
import { useEffect, useMemo } from 'react';

import { getCollabAdapter, getCollabConfig } from './config';
import { useCollabStore } from './store';

const CollabMountedContext = React.createContext(false);
export const useCollabMounted = () => React.use(CollabMountedContext);

// ─── Auto-connect child (must be inside CollabProvider) ─────────────────────

type AutoConnectProps = {
  serverUrl: string;
};

function CollabAutoConnect({ serverUrl }: AutoConnectProps) {
  const { authToken, userId } = useCollabStore();
  const { connect, disconnect, isConnected } = useCollab();

  useEffect(() => {
    if (authToken && userId && !isConnected) {
      connect({ serverUrl, token: authToken, userId });
    }
    else if (!authToken && isConnected) {
      disconnect();
    }
  }, [authToken, userId, isConnected, connect, disconnect, serverUrl]);

  return null;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export type CollabProviderProps = {
  children: React.ReactNode;
};

export function ZivaCollabProvider({ children }: CollabProviderProps) {
  const config = getCollabConfig();

  const collabConfig = useMemo<CollabConfig | null>(() => {
    const currentAdapter = getCollabAdapter();
    if (!config.enabled || !currentAdapter)
      return null;
    return {
      adapter: currentAdapter,
      autoConnect: false,
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30_000,
      },
      logger: __DEV__
        ? {
            debug: (msg, data) => console.log(`[RC] ${msg}`, data),
            info: (msg, data) => console.log(`[RC] ${msg}`, data),
            warn: (msg, data) => console.warn(`[RC] ${msg}`, data),
            error: (msg, data) => console.error(`[RC] ${msg}`, data),
          }
        : undefined,
    };
  }, [config.enabled]);

  if (!collabConfig) {
    return (
      <CollabMountedContext value={false}>
        {children}
      </CollabMountedContext>
    );
  }

  return (
    <CollabMountedContext value={true}>
      <CollabProvider config={collabConfig}>
        <CollabAutoConnect serverUrl={config.serverUrl} />
        {children}
      </CollabProvider>
    </CollabMountedContext>
  );
}

// ─── Convenience hook ────────────────────────────────────────────────────────

/**
 * Check if collab is connected.
 * Thin wrapper around useCollab().isConnected from @mongrov/collab.
 */
export function useCollabConnected(): boolean {
  const { isConnected } = useCollab();
  return isConnected;
}

// ─── Re-export for backward compat ──────────────────────────────────────────
// Consumers import CollabProvider from @/lib/collab — this satisfies that.
export { ZivaCollabProvider as CollabProvider };
