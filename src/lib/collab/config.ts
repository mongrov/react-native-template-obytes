import type { RocketChatAdapter } from './adapters/rocketchat';

import Env from 'env';
import {
  createRocketChatAdapter,
} from './adapters/rocketchat';

// ─── Config types ─────────────────────────────────────────────────────────────

export type CollabConfig = {
  serverUrl: string;
  wsUrl: string;
  enabled: boolean;
};

// ─── Ziva auth constants ──────────────────────────────────────────────────────

export const COLLAB_ADMIN_TOKEN = Env.EXPO_PUBLIC_COLLAB_ADMIN_TOKEN ?? '';

export const APPLE = 'apple' as const;
export const GOOGLE = 'google' as const;
export const COLLAB_LOGIN = 'COLLAB_LOGIN';
export const GOOGLE_LOGIN = 'GOOGLE_LOGIN';
export const APPLE_LOGIN = 'APPLE_LOGIN';

// ─── Config factory ───────────────────────────────────────────────────────────

export function getCollabConfig(): CollabConfig {
  const serverUrl = Env.EXPO_PUBLIC_RC_SERVER_URL ?? '';
  const wsUrl = Env.EXPO_PUBLIC_RC_WS_URL ?? '';

  return {
    serverUrl,
    wsUrl,
    enabled: Boolean(serverUrl && wsUrl),
  };
}

// ─── Adapter singleton ────────────────────────────────────────────────────────

let adapterInstance: RocketChatAdapter | null = null;

export function getCollabAdapter(): RocketChatAdapter | null {
  const config = getCollabConfig();

  if (!config.enabled) {
    return null;
  }

  if (!adapterInstance) {
    adapterInstance = createRocketChatAdapter({
      serverUrl: config.serverUrl,
      wsUrl: config.wsUrl,
      logger: __DEV__
        ? {
            debug: (msg, data) => console.log(`[RC] ${msg}`, data),
            info: (msg, data) => console.log(`[RC] ${msg}`, data),
            warn: (msg, data) => console.warn(`[RC] ${msg}`, data),
            error: (msg, data) => console.error(`[RC] ${msg}`, data),
          }
        : undefined,
    });
  }

  return adapterInstance;
}

export function resetCollabAdapter(): void {
  if (adapterInstance) {
    adapterInstance.disconnect().catch(() => {});
    adapterInstance = null;
  }
}
