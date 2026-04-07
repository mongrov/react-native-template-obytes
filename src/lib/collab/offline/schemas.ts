/**
 * RxDB Schemas for Offline Storage
 *
 * Schemas for messages and conversations matching @mongrov/types.
 */

import type { RxJsonSchema } from 'rxdb'

// ─── Message Schema ─────────────────────────────────────────────────────────

export interface MessageDoc {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderType: string
  contentType: string
  contentText?: string
  contentUri?: string
  contentMimeType?: string
  contentFileName?: string
  parentId?: string
  deliveryStatus: string
  streaming?: boolean
  editedAt?: string
  editedById?: string
  updatedAt?: string
  systemType?: string
  createdAt: string
  // Metadata stored as JSON string
  metadata?: string
  // For offline sync
  _pendingSend?: boolean
  _localId?: string
}

export const messageSchema: RxJsonSchema<MessageDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    conversationId: { type: 'string', maxLength: 100 },
    senderId: { type: 'string', maxLength: 100 },
    senderName: { type: 'string', maxLength: 200 },
    senderType: { type: 'string', maxLength: 20 },
    contentType: { type: 'string', maxLength: 20 },
    contentText: { type: 'string' },
    contentUri: { type: 'string' },
    contentMimeType: { type: 'string', maxLength: 100 },
    contentFileName: { type: 'string', maxLength: 500 },
    parentId: { type: 'string', maxLength: 100 },
    deliveryStatus: { type: 'string', maxLength: 20 },
    streaming: { type: 'boolean' },
    editedAt: { type: 'string', maxLength: 50 },
    editedById: { type: 'string', maxLength: 100 },
    updatedAt: { type: 'string', maxLength: 50 },
    systemType: { type: 'string', maxLength: 50 },
    createdAt: { type: 'string', maxLength: 50 },
    metadata: { type: 'string' },
    _pendingSend: { type: 'boolean' },
    _localId: { type: 'string', maxLength: 100 },
  },
  required: ['id', 'conversationId', 'senderId', 'senderName', 'senderType', 'contentType', 'deliveryStatus', 'createdAt'],
  indexes: [
    'conversationId',
    'createdAt',
    ['conversationId', 'createdAt'],
    'updatedAt',
    '_pendingSend',
  ],
}

// ─── Conversation Schema ────────────────────────────────────────────────────

export interface ConversationDoc {
  id: string
  type: string
  groupState?: string
  name?: string
  avatar?: string
  unreadCount: number
  muted: boolean
  pinned: boolean
  topic?: string
  description?: string
  lastMessageId?: string
  lastMessageText?: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
  // Metadata stored as JSON string
  metadata?: string
  // High-water mark for sync
  _syncedAt?: string
}

export const conversationSchema: RxJsonSchema<ConversationDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    type: { type: 'string', maxLength: 20 },
    groupState: { type: 'string', maxLength: 20 },
    name: { type: 'string', maxLength: 500 },
    avatar: { type: 'string' },
    unreadCount: { type: 'number' },
    muted: { type: 'boolean' },
    pinned: { type: 'boolean' },
    topic: { type: 'string' },
    description: { type: 'string' },
    lastMessageId: { type: 'string', maxLength: 100 },
    lastMessageText: { type: 'string' },
    lastMessageAt: { type: 'string', maxLength: 50 },
    createdAt: { type: 'string', maxLength: 50 },
    updatedAt: { type: 'string', maxLength: 50 },
    metadata: { type: 'string' },
    _syncedAt: { type: 'string', maxLength: 50 },
  },
  required: ['id', 'type', 'unreadCount', 'muted', 'pinned', 'createdAt', 'updatedAt'],
  indexes: [
    'type',
    'updatedAt',
    'pinned',
    '_syncedAt',
  ],
}

// ─── Sync Checkpoint Schema ─────────────────────────────────────────────────

export interface SyncCheckpointDoc {
  id: string // conversationId or 'global'
  updatedAt: string // High-water mark
  syncedAt: string // When we last synced
}

export const syncCheckpointSchema: RxJsonSchema<SyncCheckpointDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    updatedAt: { type: 'string', maxLength: 50 },
    syncedAt: { type: 'string', maxLength: 50 },
  },
  required: ['id', 'updatedAt', 'syncedAt'],
}
