/**
 * Collab module for RocketChat + Ziva integration
 *
 * Provides:
 * - RC client layer (types, DDP protocol, mappers)
 * - RocketChat adapter (extends @mongrov/collab BaseAdapter)
 * - Offline sync with RxDB
 * - React provider wrapping @mongrov/collab CollabProvider
 * - Ziva-specific: auth, users, glucose, wellness groups
 */

// Adapters
export * from './adapters';

export * from './auth';

export * from './client';

// Config and factory
export * from './config';

export * from './glucose';
export * from './groups';

export * from './hooks/use-collab-sync';
// Hooks
export * from './hooks/use-social-login';
export * from './hooks/use-wellness-groups';
// Offline sync
export * from './offline';
// Provider and compat hooks
export { CollabProvider, useCollabConnected, useCollabMounted, ZivaCollabProvider } from './provider';
export type { CollabProviderProps } from './provider';

// RC client layer
export * from './rc-client';
// Ziva-specific modules
export * from './store';
export * from './users';

// Re-export @mongrov/collab hooks so consumers import from @/lib/collab
export { useCollab, useMessages, usePresence, useTyping } from '@mongrov/collab';
