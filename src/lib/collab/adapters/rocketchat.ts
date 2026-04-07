/**
 * RocketChat Adapter Implementation
 *
 * Full implementation of CollabAdapter for RocketChat backend.
 * Uses DDP for real-time subscriptions and REST API for data operations.
 */

import type { AxiosInstance } from 'axios'
import type {
  Message,
  Conversation,
  Participant,
  Unsubscribe,
} from '@mongrov/types'

import {
  DDPClient,
  createDDPClient,
  toMessage,
  toConversation,
  toParticipant,
  fromMessageContent,
  type RCMessage,
  type RCRoom,
  type RCSubscription,
  type RCUser,
  type RCMessagesResponse,
  type RCRoomsResponse,
  type RCSubscriptionsResponse,
  type RCSendMessageResponse,
  type RCChannelMembersResponse,
} from '../rc-client'

// ─── Types ──────────────────────────────────────────────────────────────────

export type RCConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export type PresenceState = 'online' | 'away' | 'busy' | 'offline'

export interface RCAdapterConfig {
  /** REST API base URL (e.g., https://chat.example.com) */
  serverUrl: string
  /** WebSocket URL (e.g., wss://chat.example.com/websocket) */
  wsUrl: string
  /** Optional logger */
  logger?: RCLogger
}

export interface RCAdapterCredentials {
  /** Auth token from @mongrov/auth */
  token: string
  /** User ID */
  userId: string
}

export interface RCLogger {
  debug(msg: string, data?: Record<string, unknown>): void
  info(msg: string, data?: Record<string, unknown>): void
  warn(msg: string, data?: Record<string, unknown>): void
  error(msg: string, data?: Record<string, unknown>): void
}

export interface SendMessageParams {
  conversationId: string
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'file'
    text?: string
    uri?: string
    mimeType?: string
    fileName?: string
  }
  parentId?: string
  mentions?: string[]
}

export interface SendMessageResult {
  messageId: string
  message: Message
}

export interface FetchMessagesOptions {
  limit?: number
  before?: string
  after?: string
}

export interface FetchMessagesResult {
  messages: Message[]
  hasMore: boolean
}

export interface FetchConversationsOptions {
  limit?: number
  offset?: number
  type?: 'direct' | 'group' | 'channel'
}

export interface FetchConversationsResult {
  conversations: Conversation[]
  hasMore: boolean
  total?: number
}

export interface SearchOptions {
  limit?: number
  conversationId?: string
}

// ─── Event Types ────────────────────────────────────────────────────────────

export interface RCAdapterEvents {
  'connection:status': RCConnectionStatus
  'connection:connected': void
  'connection:disconnected': { reason?: string }
  'connection:error': { error: Error }
  'message:received': Message
  'message:updated': Message
  'message:deleted': { messageId: string; conversationId: string }
  'typing:start': { conversationId: string; userId: string; userName?: string }
  'typing:stop': { conversationId: string; userId: string }
  'presence:changed': { userId: string; status: PresenceState }
  'presence:online': { userId: string }
  'presence:offline': { userId: string }
  'conversation:updated': Conversation
  'conversation:joined': Conversation
  'conversation:left': { conversationId: string }
}

type EventHandler<T> = (payload: T) => void

// ─── Adapter Implementation ─────────────────────────────────────────────────

export class RocketChatAdapter {
  readonly id = 'rocketchat'

  private config: RCAdapterConfig
  private credentials: RCAdapterCredentials | null = null
  private ddp: DDPClient | null = null
  private axios: AxiosInstance | null = null
  private _status: RCConnectionStatus = 'disconnected'

  // Event handling
  private eventHandlers = new Map<string, Set<EventHandler<unknown>>>()

  // Room subscription tracking
  private roomSubscriptions = new Map<string, string>() // roomId -> subId
  private typingSubscriptions = new Map<string, string>() // roomId -> subId

  constructor(config: RCAdapterConfig) {
    this.config = config
  }

  // ─── Status ─────────────────────────────────────────────────────────────

  get status(): RCConnectionStatus {
    return this._status
  }

  private setStatus(status: RCConnectionStatus): void {
    if (this._status !== status) {
      this._status = status
      this.emit('connection:status', status)
    }
  }

  // ─── Event Handling ─────────────────────────────────────────────────────

  on<K extends keyof RCAdapterEvents>(
    event: K,
    handler: EventHandler<RCAdapterEvents[K]>
  ): Unsubscribe {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler<unknown>)

    return () => {
      this.eventHandlers.get(event)?.delete(handler as EventHandler<unknown>)
    }
  }

  private emit<K extends keyof RCAdapterEvents>(
    event: K,
    payload: RCAdapterEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          this.log('error', `Error in event handler for ${event}`, { error })
        }
      })
    }
  }

  // ─── Connection ─────────────────────────────────────────────────────────

  async connect(credentials: RCAdapterCredentials, axios: AxiosInstance): Promise<void> {
    if (this._status === 'connected') {
      return
    }

    this.credentials = credentials
    this.axios = axios
    this.setStatus('connecting')

    try {
      // Create DDP client
      this.ddp = createDDPClient(this.config.wsUrl)

      // Set up DDP event handlers
      this.setupDDPHandlers()

      // Connect DDP
      await this.ddp.connect()

      // Login via DDP
      await this.ddp.call('login', { resume: credentials.token })

      this.setStatus('connected')
      this.emit('connection:connected', undefined as void)

      this.log('info', 'Connected to RocketChat', { userId: credentials.userId })
    } catch (error) {
      this.setStatus('error')
      this.emit('connection:error', { error: error as Error })
      throw error
    }
  }

  async disconnect(): Promise<void> {
    // Unsubscribe from all rooms
    this.roomSubscriptions.forEach((subId) => {
      this.ddp?.unsubscribe(subId)
    })
    this.roomSubscriptions.clear()

    this.typingSubscriptions.forEach((subId) => {
      this.ddp?.unsubscribe(subId)
    })
    this.typingSubscriptions.clear()

    // Disconnect DDP
    this.ddp?.disconnect()
    this.ddp = null

    this.setStatus('disconnected')
    this.emit('connection:disconnected', {})

    this.log('info', 'Disconnected from RocketChat')
  }

  private setupDDPHandlers(): void {
    if (!this.ddp) return

    this.ddp.on('disconnected', () => {
      this.setStatus('disconnected')
      this.emit('connection:disconnected', { reason: 'WebSocket closed' })
    })

    // Handle real-time message updates
    this.ddp.on('changed', (msg) => {
      if (msg.collection === 'stream-room-messages') {
        const args = msg.fields?.args as RCMessage[] | undefined
        const rcMessage = args?.[0]
        if (rcMessage) {
          const message = toMessage(rcMessage)
          this.emit('message:received', message)
        }
      }

      // Handle typing indicators
      if (msg.collection === 'stream-notify-room') {
        const args = msg.fields?.args as [string, boolean] | undefined
        if (args && msg.id?.includes('/typing')) {
          const [username, isTyping] = args
          const roomId = msg.id.split('/')[0]
          if (isTyping) {
            this.emit('typing:start', {
              conversationId: roomId,
              userId: username,
              userName: username,
            })
          } else {
            this.emit('typing:stop', {
              conversationId: roomId,
              userId: username,
            })
          }
        }
      }
    })
  }

  // ─── Messages ───────────────────────────────────────────────────────────

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    this.ensureConnected()

    const payload = fromMessageContent(
      params.conversationId,
      params.content,
      params.parentId
    )

    const response = await this.rest<RCSendMessageResponse>('POST', '/api/v1/chat.sendMessage', {
      message: payload,
    })

    const message = toMessage(response.message)
    return {
      messageId: message.id,
      message,
    }
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.update', {
      msgId: messageId,
      text: newContent,
    })
  }

  async deleteMessage(messageId: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.delete', {
      msgId: messageId,
    })
  }

  async fetchMessages(
    conversationId: string,
    options?: FetchMessagesOptions
  ): Promise<FetchMessagesResult> {
    this.ensureConnected()

    const params: Record<string, string | number> = {
      roomId: conversationId,
      count: options?.limit ?? 50,
    }

    if (options?.before) {
      params.latest = options.before
    }
    if (options?.after) {
      params.oldest = options.after
    }

    const response = await this.rest<RCMessagesResponse>(
      'GET',
      '/api/v1/channels.history',
      undefined,
      params
    )

    const messages = response.messages.map(toMessage)
    return {
      messages,
      hasMore: messages.length === (options?.limit ?? 50),
    }
  }

  // ─── Conversations ──────────────────────────────────────────────────────

  async fetchConversations(
    options?: FetchConversationsOptions
  ): Promise<FetchConversationsResult> {
    this.ensureConnected()

    // Fetch rooms and subscriptions in parallel
    const [roomsResponse, subsResponse] = await Promise.all([
      this.rest<RCRoomsResponse>('GET', '/api/v1/rooms.get', undefined, {
        updatedSince: '1970-01-01T00:00:00.000Z',
      }),
      this.rest<RCSubscriptionsResponse>('GET', '/api/v1/subscriptions.get', undefined, {
        updatedSince: '1970-01-01T00:00:00.000Z',
      }),
    ])

    // Create subscription lookup by room ID
    const subsByRoomId = new Map<string, RCSubscription>()
    for (const sub of subsResponse.update) {
      subsByRoomId.set(sub.rid, sub)
    }

    // Join rooms with subscriptions
    let conversations = roomsResponse.update.map((room) => {
      const sub = subsByRoomId.get(room._id)
      return toConversation(room, sub, this.config.serverUrl)
    })

    // Filter by type if specified
    if (options?.type) {
      const typeMap = {
        direct: '1:1',
        group: 'group',
        channel: 'channel',
      }
      const targetType = typeMap[options.type]
      conversations = conversations.filter((c) => c.type === targetType)
    }

    // Apply pagination
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? 50
    const paginated = conversations.slice(offset, offset + limit)

    return {
      conversations: paginated,
      hasMore: offset + limit < conversations.length,
      total: conversations.length,
    }
  }

  // ─── Reactions ──────────────────────────────────────────────────────────

  async addReaction(messageId: string, emoji: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.react', {
      messageId,
      emoji,
      shouldReact: true,
    })
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.react', {
      messageId,
      emoji,
      shouldReact: false,
    })
  }

  // ─── Typing ─────────────────────────────────────────────────────────────

  async sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
    this.ensureConnected()

    await this.ddp?.call('stream-notify-room', `${conversationId}/typing`, this.credentials?.userId, isTyping)
  }

  // ─── Presence ───────────────────────────────────────────────────────────

  async setPresence(status: PresenceState): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/users.setStatus', {
      status,
    })
  }

  // ─── Read Receipts ──────────────────────────────────────────────────────

  async markAsRead(conversationId: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/subscriptions.read', {
      rid: conversationId,
    })
  }

  // ─── Room Subscriptions ─────────────────────────────────────────────────

  async subscribeToConversation(conversationId: string): Promise<Unsubscribe> {
    this.ensureConnected()

    // Already subscribed?
    if (this.roomSubscriptions.has(conversationId)) {
      return () => this.unsubscribeFromConversation(conversationId)
    }

    // Subscribe to room messages
    const subId = await this.ddp!.subscribe('stream-room-messages', conversationId, false)
    this.roomSubscriptions.set(conversationId, subId)

    // Subscribe to typing indicators
    const typingSubId = await this.ddp!.subscribe(
      'stream-notify-room',
      `${conversationId}/typing`,
      false
    )
    this.typingSubscriptions.set(conversationId, typingSubId)

    this.log('debug', 'Subscribed to room', { conversationId })

    return () => this.unsubscribeFromConversation(conversationId)
  }

  private unsubscribeFromConversation(conversationId: string): void {
    const subId = this.roomSubscriptions.get(conversationId)
    if (subId) {
      this.ddp?.unsubscribe(subId)
      this.roomSubscriptions.delete(conversationId)
    }

    const typingSubId = this.typingSubscriptions.get(conversationId)
    if (typingSubId) {
      this.ddp?.unsubscribe(typingSubId)
      this.typingSubscriptions.delete(conversationId)
    }

    this.log('debug', 'Unsubscribed from room', { conversationId })
  }

  async subscribeToPresence(userIds: string[]): Promise<Unsubscribe> {
    this.ensureConnected()

    const subId = await this.ddp!.subscribe('stream-notify-logged', 'user-status', false)

    return () => {
      this.ddp?.unsubscribe(subId)
    }
  }

  // ─── Users ──────────────────────────────────────────────────────────────

  async getUser(userId: string): Promise<Participant | null> {
    this.ensureConnected()

    try {
      const response = await this.rest<{ success: boolean; user: RCUser }>(
        'GET',
        '/api/v1/users.info',
        undefined,
        { userId }
      )

      return toParticipant(response.user)
    } catch {
      return null
    }
  }

  // ─── Members ────────────────────────────────────────────────────────────

  async getMembers(conversationId: string): Promise<Participant[]> {
    this.ensureConnected()

    const response = await this.rest<RCChannelMembersResponse>(
      'GET',
      '/api/v1/channels.members',
      undefined,
      { roomId: conversationId }
    )

    return response.members.map(toParticipant)
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  async searchMessages(query: string, options?: SearchOptions): Promise<Message[]> {
    this.ensureConnected()

    const params: Record<string, string | number> = {
      searchText: query,
      count: options?.limit ?? 50,
    }

    if (options?.conversationId) {
      params.roomId = options.conversationId
    }

    const response = await this.rest<RCMessagesResponse>(
      'GET',
      '/api/v1/chat.search',
      undefined,
      params
    )

    return response.messages.map(toMessage)
  }

  // ─── Pins ───────────────────────────────────────────────────────────────

  async pinMessage(messageId: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.pinMessage', {
      messageId,
    })
  }

  async unpinMessage(messageId: string): Promise<void> {
    this.ensureConnected()

    await this.rest('POST', '/api/v1/chat.unPinMessage', {
      messageId,
    })
  }

  // ─── REST Helpers ───────────────────────────────────────────────────────

  private async rest<T>(
    method: 'GET' | 'POST',
    path: string,
    data?: Record<string, unknown>,
    params?: Record<string, string | number>
  ): Promise<T> {
    if (!this.axios || !this.credentials) {
      throw new Error('Not connected')
    }

    const response = await this.axios.request<T>({
      method,
      url: `${this.config.serverUrl}${path}`,
      headers: {
        'X-Auth-Token': this.credentials.token,
        'X-User-Id': this.credentials.userId,
      },
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? params : undefined,
    })

    return response.data
  }

  // ─── Utilities ──────────────────────────────────────────────────────────

  private ensureConnected(): void {
    if (this._status !== 'connected') {
      throw new Error('Not connected to RocketChat')
    }
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    msg: string,
    data?: Record<string, unknown>
  ): void {
    this.config.logger?.[level](`[RC] ${msg}`, data)
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createRocketChatAdapter(config: RCAdapterConfig): RocketChatAdapter {
  return new RocketChatAdapter(config)
}
