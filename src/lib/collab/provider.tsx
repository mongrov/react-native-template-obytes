/**
 * CollabProvider
 *
 * React context provider that manages RocketChat connection lifecycle.
 * Automatically connects when authenticated and disconnects on logout.
 */

import * as React from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { useSession } from '@mongrov/auth'

import {
  getCollabAdapter,
  getCollabConfig,
  connectCollab,
  disconnectCollab,
  resetCollabAdapter,
} from './config'
import type { RocketChatAdapter, RCConnectionStatus } from './adapters/rocketchat'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollabContextValue {
  /** Whether collab is enabled (has RC config) */
  enabled: boolean
  /** Current connection status */
  status: RCConnectionStatus
  /** The adapter instance (null if not enabled) */
  adapter: RocketChatAdapter | null
  /** Manually trigger reconnect */
  reconnect: () => Promise<void>
  /** Disconnect */
  disconnect: () => Promise<void>
}

const CollabContext = createContext<CollabContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────

export interface CollabProviderProps {
  children: React.ReactNode
}

export function CollabProvider({ children }: CollabProviderProps) {
  const session = useSession()
  const config = getCollabConfig()
  const adapter = getCollabAdapter()

  const [status, setStatus] = useState<RCConnectionStatus>('disconnected')

  // Subscribe to connection status changes
  useEffect(() => {
    if (!adapter) return

    const unsubscribe = adapter.on('connection:status', (newStatus) => {
      setStatus(newStatus)
    })

    return unsubscribe
  }, [adapter])

  // Auto-connect when authenticated
  useEffect(() => {
    if (!adapter || !session?.accessToken || !session?.user?.id) {
      return
    }

    // Don't reconnect if already connected
    if (status === 'connected' || status === 'connecting') {
      return
    }

    connectCollab(session.accessToken, session.user.id).catch((error) => {
      console.error('[Collab] Failed to connect:', error)
    })
  }, [adapter, session?.accessToken, session?.user?.id, status])

  // Disconnect on logout
  useEffect(() => {
    if (!session?.accessToken && status === 'connected') {
      disconnectCollab().catch((error) => {
        console.error('[Collab] Failed to disconnect:', error)
      })
    }
  }, [session?.accessToken, status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetCollabAdapter()
    }
  }, [])

  const reconnect = useCallback(async () => {
    if (!adapter || !session?.accessToken || !session?.user?.id) {
      throw new Error('Cannot reconnect: not authenticated')
    }
    await connectCollab(session.accessToken, session.user.id)
  }, [adapter, session?.accessToken, session?.user?.id])

  const disconnect = useCallback(async () => {
    await disconnectCollab()
  }, [])

  const value: CollabContextValue = {
    enabled: config.enabled,
    status,
    adapter,
    reconnect,
    disconnect,
  }

  return (
    <CollabContext.Provider value={value}>
      {children}
    </CollabContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Access collab context.
 */
export function useCollab(): CollabContextValue {
  const context = useContext(CollabContext)
  if (!context) {
    throw new Error('useCollab must be used within CollabProvider')
  }
  return context
}

/**
 * Check if collab is connected.
 */
export function useCollabConnected(): boolean {
  const { status } = useCollab()
  return status === 'connected'
}
