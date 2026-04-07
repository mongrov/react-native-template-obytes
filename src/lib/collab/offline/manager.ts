/**
 * Offline Manager
 *
 * Manages offline-first messaging with RxDB and RC adapter.
 *
 * Features:
 * - Optimistic sends: Insert locally → send via adapter → update status
 * - High-water mark sync: Per-conversation updatedAt tracking
 * - Reconnect sync: Fetch missed messages on reconnect
 * - Server wins: Merge conflicts resolved by server timestamp
 */

import type { Message, Conversation } from '@mongrov/types'
import type { RocketChatAdapter, SendMessageParams } from '../adapters/rocketchat'
import type { MessageDoc, ConversationDoc } from './schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OfflineManagerConfig {
  /** RocketChat adapter instance */
  adapter: RocketChatAdapter
  /** RxDB database instance */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
  /** Optional logger */
  logger?: OfflineLogger
}

export interface OfflineLogger {
  debug(msg: string, data?: Record<string, unknown>): void
  info(msg: string, data?: Record<string, unknown>): void
  warn(msg: string, data?: Record<string, unknown>): void
  error(msg: string, data?: Record<string, unknown>): void
}

// ─── Converters ─────────────────────────────────────────────────────────────

function messageToDoc(msg: Message): MessageDoc {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.sender.id,
    senderName: msg.sender.name,
    senderType: msg.sender.type,
    contentType: msg.content.type,
    contentText: msg.content.text,
    contentUri: msg.content.uri,
    contentMimeType: msg.content.mimeType,
    contentFileName: msg.content.fileName,
    parentId: msg.parentId,
    deliveryStatus: msg.deliveryStatus,
    streaming: msg.streaming,
    editedAt: msg.editedAt,
    editedById: msg.editedBy?.id,
    updatedAt: msg.updatedAt,
    systemType: msg.systemType,
    createdAt: msg.createdAt,
    metadata: msg.metadata ? JSON.stringify(msg.metadata) : undefined,
  }
}

function docToMessage(doc: MessageDoc): Message {
  return {
    id: doc.id,
    conversationId: doc.conversationId,
    sender: {
      id: doc.senderId,
      name: doc.senderName,
      type: doc.senderType as 'human' | 'ai' | 'bot' | 'system',
    },
    content: {
      type: doc.contentType as Message['content']['type'],
      text: doc.contentText,
      uri: doc.contentUri,
      mimeType: doc.contentMimeType,
      fileName: doc.contentFileName,
    },
    parentId: doc.parentId,
    deliveryStatus: doc.deliveryStatus as Message['deliveryStatus'],
    streaming: doc.streaming,
    editedAt: doc.editedAt,
    editedBy: doc.editedById
      ? { id: doc.editedById, name: '', type: 'human' as const }
      : undefined,
    updatedAt: doc.updatedAt,
    systemType: doc.systemType,
    createdAt: doc.createdAt,
    metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
  }
}

function conversationToDoc(conv: Conversation): ConversationDoc {
  return {
    id: conv.id,
    type: conv.type,
    groupState: conv.groupState,
    name: conv.name,
    avatar: conv.avatar,
    unreadCount: conv.unreadCount,
    muted: conv.muted,
    pinned: conv.pinned,
    topic: conv.topic,
    description: conv.description,
    lastMessageId: conv.lastMessage?.id,
    lastMessageText: conv.lastMessage?.content.text,
    lastMessageAt: conv.lastMessage?.createdAt,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    metadata: conv.metadata ? JSON.stringify(conv.metadata) : undefined,
  }
}

function docToConversation(doc: ConversationDoc): Conversation {
  return {
    id: doc.id,
    type: doc.type as Conversation['type'],
    groupState: doc.groupState as Conversation['groupState'],
    name: doc.name,
    avatar: doc.avatar,
    members: [], // Members fetched separately
    unreadCount: doc.unreadCount,
    muted: doc.muted,
    pinned: doc.pinned,
    topic: doc.topic,
    description: doc.description,
    lastMessage: doc.lastMessageId
      ? {
          id: doc.lastMessageId,
          conversationId: doc.id,
          sender: { id: '', name: '', type: 'human' as const },
          content: { type: 'text', text: doc.lastMessageText },
          deliveryStatus: 'delivered',
          createdAt: doc.lastMessageAt ?? doc.updatedAt,
        }
      : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
  }
}

// ─── Offline Manager ────────────────────────────────────────────────────────

export class OfflineManager {
  private adapter: RocketChatAdapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any
  private logger?: OfflineLogger
  private isOnline = false

  constructor(config: OfflineManagerConfig) {
    this.adapter = config.adapter
    this.db = config.db
    this.logger = config.logger

    // Listen for connection status
    this.adapter.on('connection:status', (status) => {
      const wasOffline = !this.isOnline
      this.isOnline = status === 'connected'

      if (wasOffline && this.isOnline) {
        this.onReconnect()
      }
    })

    // Listen for real-time messages
    this.adapter.on('message:received', (message) => {
      this.handleIncomingMessage(message)
    })
  }

  // ─── Message Operations ───────────────────────────────────────────────────

  /**
   * Send message with optimistic insert.
   * 1. Insert into RxDB with 'sending' status
   * 2. Send via adapter
   * 3. Update with server ID and 'sent' status
   */
  async sendMessage(
    conversationId: string,
    content: Message['content'],
    parentId?: string
  ): Promise<Message> {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const now = new Date().toISOString()

    // Create optimistic message
    const optimisticDoc: MessageDoc = {
      id: localId,
      conversationId,
      senderId: '', // Will be filled by adapter
      senderName: 'Me',
      senderType: 'human',
      contentType: content.type,
      contentText: content.text,
      contentUri: content.uri,
      contentMimeType: content.mimeType,
      contentFileName: content.fileName,
      parentId,
      deliveryStatus: 'sending',
      createdAt: now,
      _pendingSend: true,
      _localId: localId,
    }

    // Insert optimistically
    await this.db.messages.insert(optimisticDoc)
    this.log('debug', 'Optimistic insert', { localId, conversationId })

    try {
      // Send via adapter (cast content type for adapter compatibility)
      const result = await this.adapter.sendMessage({
        conversationId,
        content: content as SendMessageParams['content'],
        parentId,
      })

      // Update with server response
      await this.db.messages.findOne(localId).remove()
      await this.db.messages.insert(messageToDoc(result.message))

      this.log('debug', 'Message sent successfully', {
        localId,
        serverId: result.messageId,
      })

      return result.message
    } catch (error) {
      // Mark as failed
      await this.db.messages
        .findOne(localId)
        .update({ $set: { deliveryStatus: 'failed' } })

      this.log('error', 'Failed to send message', { localId, error })
      throw error
    }
  }

  /**
   * Retry failed message.
   */
  async retryMessage(localId: string): Promise<Message> {
    const doc = await this.db.messages.findOne(localId).exec()
    if (!doc) {
      throw new Error('Message not found')
    }

    // Update status to sending
    await this.db.messages
      .findOne(localId)
      .update({ $set: { deliveryStatus: 'sending' } })

    try {
      const result = await this.adapter.sendMessage({
        conversationId: doc.conversationId,
        content: {
          type: doc.contentType,
          text: doc.contentText,
          uri: doc.contentUri,
          mimeType: doc.contentMimeType,
          fileName: doc.contentFileName,
        },
        parentId: doc.parentId,
      })

      // Replace with server message
      await this.db.messages.findOne(localId).remove()
      await this.db.messages.insert(messageToDoc(result.message))

      return result.message
    } catch (error) {
      await this.db.messages
        .findOne(localId)
        .update({ $set: { deliveryStatus: 'failed' } })
      throw error
    }
  }

  /**
   * Get messages for a conversation from local DB.
   */
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const docs = await this.db.messages
      .find({
        selector: { conversationId },
        sort: [{ createdAt: 'desc' }],
        limit,
      })
      .exec()

    return docs.map((doc: MessageDoc) => docToMessage(doc))
  }

  /**
   * Handle incoming real-time message.
   */
  private async handleIncomingMessage(message: Message): Promise<void> {
    const doc = messageToDoc(message)
    await this.db.messages.upsert(doc)

    // Update conversation's last message
    await this.db.conversations
      .findOne(message.conversationId)
      .update({
        $set: {
          lastMessageId: message.id,
          lastMessageText: message.content.text,
          lastMessageAt: message.createdAt,
          updatedAt: message.updatedAt ?? message.createdAt,
        },
      })

    this.log('debug', 'Stored incoming message', { messageId: message.id })
  }

  // ─── Conversation Operations ──────────────────────────────────────────────

  /**
   * Get conversations from local DB.
   */
  async getConversations(): Promise<Conversation[]> {
    const docs = await this.db.conversations
      .find({
        sort: [{ updatedAt: 'desc' }],
      })
      .exec()

    return docs.map((doc: ConversationDoc) => docToConversation(doc))
  }

  /**
   * Sync conversations from server.
   */
  async syncConversations(): Promise<void> {
    if (!this.isOnline) {
      this.log('warn', 'Cannot sync conversations while offline')
      return
    }

    try {
      const result = await this.adapter.fetchConversations()

      for (const conv of result.conversations) {
        const doc = conversationToDoc(conv)
        doc._syncedAt = new Date().toISOString()
        await this.db.conversations.upsert(doc)
      }

      this.log('info', 'Synced conversations', { count: result.conversations.length })
    } catch (error) {
      this.log('error', 'Failed to sync conversations', { error })
      throw error
    }
  }

  // ─── Sync Operations ──────────────────────────────────────────────────────

  /**
   * Sync messages for a conversation using high-water mark.
   */
  async syncMessages(conversationId: string): Promise<void> {
    if (!this.isOnline) {
      this.log('warn', 'Cannot sync messages while offline')
      return
    }

    try {
      // Get high-water mark (last synced updatedAt)
      const checkpoint = await this.db.syncCheckpoints.findOne(conversationId).exec()
      const lastUpdatedAt = checkpoint?.updatedAt ?? '1970-01-01T00:00:00.000Z'

      // Fetch messages since last sync
      const result = await this.adapter.fetchMessages(conversationId, {
        after: lastUpdatedAt,
        limit: 100,
      })

      // Upsert messages (server wins)
      for (const message of result.messages) {
        const doc = messageToDoc(message)
        await this.db.messages.upsert(doc)
      }

      // Update checkpoint
      if (result.messages.length > 0) {
        const latestUpdatedAt = result.messages
          .map((m) => m.updatedAt ?? m.createdAt)
          .sort()
          .pop()

        await this.db.syncCheckpoints.upsert({
          id: conversationId,
          updatedAt: latestUpdatedAt,
          syncedAt: new Date().toISOString(),
        })
      }

      this.log('info', 'Synced messages', {
        conversationId,
        count: result.messages.length,
      })

      // Continue if there are more
      if (result.hasMore) {
        await this.syncMessages(conversationId)
      }
    } catch (error) {
      this.log('error', 'Failed to sync messages', { conversationId, error })
      throw error
    }
  }

  /**
   * Called when reconnecting after being offline.
   */
  private async onReconnect(): Promise<void> {
    this.log('info', 'Reconnected, starting sync')

    try {
      // 1. Retry failed sends
      await this.retryFailedSends()

      // 2. Sync conversations
      await this.syncConversations()

      // 3. Sync messages for active conversations
      const conversations = await this.db.conversations.find().exec()
      for (const conv of conversations) {
        await this.syncMessages(conv.id)
      }

      this.log('info', 'Reconnect sync complete')
    } catch (error) {
      this.log('error', 'Reconnect sync failed', { error })
    }
  }

  /**
   * Retry all failed message sends.
   */
  private async retryFailedSends(): Promise<void> {
    const failedDocs = await this.db.messages
      .find({
        selector: { deliveryStatus: 'failed', _pendingSend: true },
      })
      .exec()

    this.log('debug', 'Retrying failed sends', { count: failedDocs.length })

    for (const doc of failedDocs) {
      try {
        await this.retryMessage(doc.id)
      } catch {
        // Keep as failed, will retry on next reconnect
      }
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    msg: string,
    data?: Record<string, unknown>
  ): void {
    this.logger?.[level](`[Offline] ${msg}`, data)
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createOfflineManager(config: OfflineManagerConfig): OfflineManager {
  return new OfflineManager(config)
}
