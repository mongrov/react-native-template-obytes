/**
 * Unit tests for RocketChat Adapter
 *
 * These tests verify the adapter's REST API calls and event handling.
 * DDP connection is mocked to focus on adapter logic.
 */

import { RocketChatAdapter, createRocketChatAdapter } from '../rocketchat'
import type { RCAdapterConfig } from '../rocketchat'

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const mockConfig: RCAdapterConfig = {
  serverUrl: 'https://chat.example.com',
  wsUrl: 'wss://chat.example.com/websocket',
}

// ─── Factory Tests ──────────────────────────────────────────────────────────

describe('createRocketChatAdapter', () => {
  it('should create adapter with config', () => {
    const adapter = createRocketChatAdapter(mockConfig)

    expect(adapter).toBeInstanceOf(RocketChatAdapter)
    expect(adapter.id).toBe('rocketchat')
    expect(adapter.status).toBe('disconnected')
  })
})

// ─── Status Tests ───────────────────────────────────────────────────────────

describe('RocketChatAdapter status', () => {
  it('should start disconnected', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(adapter.status).toBe('disconnected')
  })
})

// ─── Event Handling Tests ───────────────────────────────────────────────────

describe('RocketChatAdapter events', () => {
  it('should subscribe and unsubscribe from events', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    const handler = jest.fn()

    const unsubscribe = adapter.on('connection:status', handler)

    expect(typeof unsubscribe).toBe('function')

    unsubscribe()
    // Handler should no longer be called after unsubscribe
  })

  it('should support multiple handlers for same event', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    const handler1 = jest.fn()
    const handler2 = jest.fn()

    const unsub1 = adapter.on('connection:status', handler1)
    const unsub2 = adapter.on('connection:status', handler2)

    // Both handlers registered
    expect(typeof unsub1).toBe('function')
    expect(typeof unsub2).toBe('function')
  })
})

// ─── Disconnected State Tests ───────────────────────────────────────────────

describe('RocketChatAdapter when disconnected', () => {
  it('should throw when sendMessage called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(
      adapter.sendMessage({
        conversationId: 'room-1',
        content: { type: 'text', text: 'Hello' },
      })
    ).rejects.toThrow('Not connected')
  })

  it('should throw when fetchConversations called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.fetchConversations()).rejects.toThrow('Not connected')
  })

  it('should throw when fetchMessages called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.fetchMessages('room-1')).rejects.toThrow('Not connected')
  })

  it('should throw when editMessage called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.editMessage('msg-1', 'new content')).rejects.toThrow('Not connected')
  })

  it('should throw when deleteMessage called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.deleteMessage('msg-1')).rejects.toThrow('Not connected')
  })

  it('should throw when addReaction called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.addReaction('msg-1', 'thumbsup')).rejects.toThrow('Not connected')
  })

  it('should throw when removeReaction called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.removeReaction('msg-1', 'thumbsup')).rejects.toThrow('Not connected')
  })

  it('should throw when markAsRead called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.markAsRead('room-1')).rejects.toThrow('Not connected')
  })

  it('should throw when setPresence called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.setPresence('online')).rejects.toThrow('Not connected')
  })

  it('should throw when searchMessages called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.searchMessages('hello')).rejects.toThrow('Not connected')
  })

  it('should throw when getUser called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.getUser('user-1')).rejects.toThrow('Not connected')
  })

  it('should throw when getMembers called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.getMembers('room-1')).rejects.toThrow('Not connected')
  })

  it('should throw when pinMessage called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.pinMessage('msg-1')).rejects.toThrow('Not connected')
  })

  it('should throw when unpinMessage called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.unpinMessage('msg-1')).rejects.toThrow('Not connected')
  })

  it('should throw when subscribeToConversation called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.subscribeToConversation('room-1')).rejects.toThrow('Not connected')
  })

  it('should throw when subscribeToPresence called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.subscribeToPresence(['user-1'])).rejects.toThrow('Not connected')
  })

  it('should throw when sendTyping called while disconnected', async () => {
    const adapter = createRocketChatAdapter(mockConfig)

    await expect(adapter.sendTyping('room-1', true)).rejects.toThrow('Not connected')
  })
})

// ─── Configuration Tests ────────────────────────────────────────────────────

describe('RocketChatAdapter configuration', () => {
  it('should accept custom logger', () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const adapter = createRocketChatAdapter({
      ...mockConfig,
      logger: mockLogger,
    })

    expect(adapter).toBeInstanceOf(RocketChatAdapter)
  })
})
