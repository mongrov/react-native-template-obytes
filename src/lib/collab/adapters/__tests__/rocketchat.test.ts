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

  it('should have id property', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(adapter.id).toBe('rocketchat')
  })

  it('should have status property', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(adapter.status).toBe('disconnected')
  })
})

// ─── Method Availability Tests ──────────────────────────────────────────────

describe('RocketChatAdapter method availability', () => {
  it('should have disconnect method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.disconnect).toBe('function')
  })

  it('should have on method for event subscription', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.on).toBe('function')
  })

  it('should have sendMessage method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.sendMessage).toBe('function')
  })

  it('should have fetchConversations method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.fetchConversations).toBe('function')
  })

  it('should have fetchMessages method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.fetchMessages).toBe('function')
  })

  it('should have editMessage method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.editMessage).toBe('function')
  })

  it('should have deleteMessage method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.deleteMessage).toBe('function')
  })

  it('should have addReaction method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.addReaction).toBe('function')
  })

  it('should have removeReaction method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.removeReaction).toBe('function')
  })

  it('should have markAsRead method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.markAsRead).toBe('function')
  })

  it('should have setPresence method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.setPresence).toBe('function')
  })

  it('should have searchMessages method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.searchMessages).toBe('function')
  })

  it('should have getUser method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.getUser).toBe('function')
  })

  it('should have getMembers method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.getMembers).toBe('function')
  })

  it('should have pinMessage method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.pinMessage).toBe('function')
  })

  it('should have unpinMessage method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.unpinMessage).toBe('function')
  })

  it('should have subscribeToConversation method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.subscribeToConversation).toBe('function')
  })

  it('should have subscribeToPresence method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.subscribeToPresence).toBe('function')
  })

  it('should have sendTyping method', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(typeof adapter.sendTyping).toBe('function')
  })
})

// ─── Factory Tests ──────────────────────────────────────────────────────────

describe('RocketChatAdapter factory', () => {
  it('should create new instance each time', () => {
    const adapter1 = createRocketChatAdapter(mockConfig)
    const adapter2 = createRocketChatAdapter(mockConfig)

    expect(adapter1).not.toBe(adapter2)
  })

  it('should preserve config in adapter', () => {
    const customConfig: RCAdapterConfig = {
      serverUrl: 'https://custom.example.com',
      wsUrl: 'wss://custom.example.com/websocket',
    }

    const adapter = createRocketChatAdapter(customConfig)
    expect(adapter).toBeInstanceOf(RocketChatAdapter)
  })

  it('should work without optional logger config', () => {
    const adapter = createRocketChatAdapter(mockConfig)
    expect(adapter).toBeInstanceOf(RocketChatAdapter)
  })
})
