/**
 * DDP (Distributed Data Protocol) client for RocketChat
 *
 * Stripped-down implementation based on RC's ddp-client.
 * - WebSocket message framing
 * - Subscribe/unsubscribe tracking
 * - Method call with promise resolution
 *
 * Note: Reconnect logic is handled by XState connection machine,
 * not by this client. connect() is idempotent.
 */

import { Emitter } from '@rocket.chat/emitter'

// --- DDP Message Types ---

export type DDPConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'

export interface DDPConnectMessage {
  msg: 'connect'
  version: '1'
  support: string[]
}

export interface DDPConnectedMessage {
  msg: 'connected'
  session: string
}

export interface DDPFailedMessage {
  msg: 'failed'
  version: string
}

export interface DDPPingMessage {
  msg: 'ping'
  id?: string
}

export interface DDPPongMessage {
  msg: 'pong'
  id?: string
}

export interface DDPMethodMessage {
  msg: 'method'
  method: string
  params: unknown[]
  id: string
}

export interface DDPResultMessage {
  msg: 'result'
  id: string
  result?: unknown
  error?: DDPError
}

export interface DDPSubMessage {
  msg: 'sub'
  id: string
  name: string
  params: unknown[]
}

export interface DDPUnsubMessage {
  msg: 'unsub'
  id: string
}

export interface DDPReadyMessage {
  msg: 'ready'
  subs: string[]
}

export interface DDPNosubMessage {
  msg: 'nosub'
  id: string
  error?: DDPError
}

export interface DDPAddedMessage {
  msg: 'added'
  collection: string
  id: string
  fields?: Record<string, unknown>
}

export interface DDPChangedMessage {
  msg: 'changed'
  collection: string
  id: string
  fields?: Record<string, unknown>
  cleared?: string[]
}

export interface DDPRemovedMessage {
  msg: 'removed'
  collection: string
  id: string
}

export interface DDPError {
  error: string | number
  reason?: string
  message?: string
  errorType?: string
}

export type DDPMessage =
  | DDPConnectMessage
  | DDPConnectedMessage
  | DDPFailedMessage
  | DDPPingMessage
  | DDPPongMessage
  | DDPMethodMessage
  | DDPResultMessage
  | DDPSubMessage
  | DDPUnsubMessage
  | DDPReadyMessage
  | DDPNosubMessage
  | DDPAddedMessage
  | DDPChangedMessage
  | DDPRemovedMessage

// --- DDP Client Events ---

export interface DDPClientEvents {
  connected: DDPConnectedMessage
  disconnected: undefined
  failed: DDPFailedMessage
  result: DDPResultMessage
  ready: DDPReadyMessage
  nosub: DDPNosubMessage
  added: DDPAddedMessage
  changed: DDPChangedMessage
  removed: DDPRemovedMessage
  'connection-status': DDPConnectionStatus
}

// --- Subscription Tracking ---

interface PendingSubscription {
  name: string
  params: unknown[]
  resolve: () => void
  reject: (error: Error) => void
}

interface PendingMethod {
  method: string
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}

// --- DDP Client ---

export class DDPClient extends Emitter<DDPClientEvents> {
  private ws: WebSocket | null = null
  private url: string
  private session: string | null = null
  private messageId = 0
  private status: DDPConnectionStatus = 'disconnected'

  // Tracking
  private pendingMethods = new Map<string, PendingMethod>()
  private pendingSubscriptions = new Map<string, PendingSubscription>()
  private activeSubscriptions = new Map<string, { name: string; params: unknown[] }>()

  constructor(url: string) {
    super()
    this.url = url
  }

  // --- Connection ---

  get connectionStatus(): DDPConnectionStatus {
    return this.status
  }

  get isConnected(): boolean {
    return this.status === 'connected'
  }

  connect(): Promise<void> {
    // Idempotent: if already connected, resolve immediately
    if (this.status === 'connected') {
      return Promise.resolve()
    }

    // If already connecting, wait for result
    if (this.status === 'connecting' && this.ws) {
      return new Promise((resolve, reject) => {
        const onConnected = () => {
          this.off('connected', onConnected)
          this.off('failed', onFailed)
          resolve()
        }
        const onFailed = (msg: DDPFailedMessage) => {
          this.off('connected', onConnected)
          this.off('failed', onFailed)
          reject(new Error(`DDP connection failed: ${msg.version}`))
        }
        this.on('connected', onConnected)
        this.on('failed', onFailed)
      })
    }

    return new Promise((resolve, reject) => {
      this.setStatus('connecting')

      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.send({
          msg: 'connect',
          version: '1',
          support: ['1'],
        })
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string)
      }

      this.ws.onerror = () => {
        this.setStatus('failed')
        reject(new Error('WebSocket error'))
      }

      this.ws.onclose = () => {
        this.setStatus('disconnected')
        this.cleanup()
      }

      // Wait for connected or failed message
      const onConnected = () => {
        this.off('connected', onConnected)
        this.off('failed', onFailed)
        resolve()
      }

      const onFailed = (msg: DDPFailedMessage) => {
        this.off('connected', onConnected)
        this.off('failed', onFailed)
        reject(new Error(`DDP version mismatch: ${msg.version}`))
      }

      this.on('connected', onConnected)
      this.on('failed', onFailed)
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setStatus('disconnected')
    this.cleanup()
  }

  // --- Method Calls ---

  call<T = unknown>(method: string, ...params: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected'))
        return
      }

      const id = this.nextId()
      this.pendingMethods.set(id, {
        method,
        resolve: resolve as (result: unknown) => void,
        reject,
      })

      this.send({
        msg: 'method',
        method,
        params,
        id,
      })
    })
  }

  // --- Subscriptions ---

  subscribe(name: string, ...params: unknown[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected'))
        return
      }

      const id = this.nextId()
      this.pendingSubscriptions.set(id, {
        name,
        params,
        resolve: () => resolve(id),
        reject,
      })

      this.send({
        msg: 'sub',
        id,
        name,
        params,
      })
    })
  }

  unsubscribe(id: string): void {
    if (!this.isConnected) return

    this.activeSubscriptions.delete(id)
    this.send({
      msg: 'unsub',
      id,
    })
  }

  // --- Message Handling ---

  private handleMessage(data: string): void {
    let msg: DDPMessage & { msg: string }
    try {
      msg = JSON.parse(data)
    } catch {
      console.warn('[DDP] Invalid JSON:', data)
      return
    }

    switch (msg.msg) {
      case 'connected':
        this.session = (msg as DDPConnectedMessage).session
        this.setStatus('connected')
        this.emit('connected', msg as DDPConnectedMessage)
        break

      case 'failed':
        this.setStatus('failed')
        this.emit('failed', msg as DDPFailedMessage)
        break

      case 'ping':
        this.send({ msg: 'pong', id: (msg as DDPPingMessage).id })
        break

      case 'result':
        this.handleResult(msg as DDPResultMessage)
        break

      case 'ready':
        this.handleReady(msg as DDPReadyMessage)
        break

      case 'nosub':
        this.handleNosub(msg as DDPNosubMessage)
        break

      case 'added':
        this.emit('added', msg as DDPAddedMessage)
        break

      case 'changed':
        this.emit('changed', msg as DDPChangedMessage)
        break

      case 'removed':
        this.emit('removed', msg as DDPRemovedMessage)
        break
    }
  }

  private handleResult(msg: DDPResultMessage): void {
    const pending = this.pendingMethods.get(msg.id)
    if (!pending) return

    this.pendingMethods.delete(msg.id)

    if (msg.error) {
      pending.reject(new Error(msg.error.reason ?? msg.error.message ?? String(msg.error.error)))
    } else {
      pending.resolve(msg.result)
    }

    this.emit('result', msg)
  }

  private handleReady(msg: DDPReadyMessage): void {
    for (const id of msg.subs) {
      const pending = this.pendingSubscriptions.get(id)
      if (pending) {
        this.pendingSubscriptions.delete(id)
        this.activeSubscriptions.set(id, { name: pending.name, params: pending.params })
        pending.resolve()
      }
    }

    this.emit('ready', msg)
  }

  private handleNosub(msg: DDPNosubMessage): void {
    const pending = this.pendingSubscriptions.get(msg.id)
    if (pending) {
      this.pendingSubscriptions.delete(msg.id)
      const errorMsg = msg.error?.reason ?? msg.error?.message ?? 'Subscription failed'
      pending.reject(new Error(errorMsg))
    }

    this.emit('nosub', msg)
  }

  // --- Utilities ---

  private send(msg: Partial<DDPMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private nextId(): string {
    return String(++this.messageId)
  }

  private setStatus(status: DDPConnectionStatus): void {
    if (this.status !== status) {
      this.status = status
      this.emit('connection-status', status)
    }
  }

  private cleanup(): void {
    // Reject all pending methods
    this.pendingMethods.forEach((pending) => {
      pending.reject(new Error('Connection closed'))
    })
    this.pendingMethods.clear()

    // Reject all pending subscriptions
    this.pendingSubscriptions.forEach((pending) => {
      pending.reject(new Error('Connection closed'))
    })
    this.pendingSubscriptions.clear()

    // Clear active subscriptions
    this.activeSubscriptions.clear()
    this.session = null
  }
}

// --- Factory ---

export function createDDPClient(url: string): DDPClient {
  return new DDPClient(url)
}
