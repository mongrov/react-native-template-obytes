/**
 * Collab module for RocketChat integration
 *
 * Provides:
 * - RC client layer (types, DDP protocol, mappers)
 * - RocketChat adapter implementation
 * - Offline sync with RxDB
 * - React provider and hooks
 */

// RC client layer
export * from './rc-client'

// Adapters
export * from './adapters'

// Offline sync
export * from './offline'

// Config and factory
export * from './config'

// Provider and hooks
export { CollabProvider, useCollab, useCollabConnected } from './provider'
export type { CollabProviderProps, CollabContextValue } from './provider'
