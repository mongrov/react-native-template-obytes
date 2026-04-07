/**
 * Collab Configuration
 *
 * Creates and configures the RocketChat adapter with auth integration.
 */

import Env from 'env'
import axios from 'axios'

import {
  createRocketChatAdapter,
  type RocketChatAdapter,
  type RCAdapterCredentials,
} from './adapters/rocketchat'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollabConfig {
  /** RC REST API server URL */
  serverUrl: string
  /** RC WebSocket URL */
  wsUrl: string
  /** Whether collab is enabled */
  enabled: boolean
}

// ─── Config ─────────────────────────────────────────────────────────────────

/**
 * Get collab configuration from environment.
 */
export function getCollabConfig(): CollabConfig {
  const serverUrl = Env.EXPO_PUBLIC_RC_SERVER_URL ?? ''
  const wsUrl = Env.EXPO_PUBLIC_RC_WS_URL ?? ''

  return {
    serverUrl,
    wsUrl,
    enabled: Boolean(serverUrl && wsUrl),
  }
}

// ─── Adapter Factory ────────────────────────────────────────────────────────

let adapterInstance: RocketChatAdapter | null = null

/**
 * Get or create the RocketChat adapter singleton.
 */
export function getCollabAdapter(): RocketChatAdapter | null {
  const config = getCollabConfig()

  if (!config.enabled) {
    return null
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
    })
  }

  return adapterInstance
}

/**
 * Connect adapter with auth credentials.
 */
export async function connectCollab(
  token: string,
  userId: string
): Promise<void> {
  const adapter = getCollabAdapter()
  if (!adapter) {
    throw new Error('Collab not enabled')
  }

  const credentials: RCAdapterCredentials = {
    token,
    userId,
  }

  // Create axios instance for REST calls
  const axiosInstance = axios.create({
    timeout: 30000,
  })

  await adapter.connect(credentials, axiosInstance)
}

/**
 * Disconnect adapter.
 */
export async function disconnectCollab(): Promise<void> {
  const adapter = getCollabAdapter()
  if (adapter) {
    await adapter.disconnect()
  }
}

/**
 * Reset adapter instance (for logout).
 */
export function resetCollabAdapter(): void {
  if (adapterInstance) {
    adapterInstance.disconnect().catch(() => {})
    adapterInstance = null
  }
}
