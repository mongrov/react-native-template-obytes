/**
 * Unit tests for RxDB schemas
 */

import {
  messageSchema,
  conversationSchema,
  syncCheckpointSchema,
} from '../schemas'

describe('messageSchema', () => {
  it('should have correct primary key', () => {
    expect(messageSchema.primaryKey).toBe('id')
  })

  it('should have correct version', () => {
    expect(messageSchema.version).toBe(0)
  })

  it('should have required fields', () => {
    expect(messageSchema.required).toContain('id')
    expect(messageSchema.required).toContain('conversationId')
    expect(messageSchema.required).toContain('senderId')
    expect(messageSchema.required).toContain('contentType')
    expect(messageSchema.required).toContain('deliveryStatus')
    expect(messageSchema.required).toContain('createdAt')
  })

  it('should have conversationId index for queries', () => {
    expect(messageSchema.indexes).toContainEqual('conversationId')
  })

  it('should have compound index for conversation + time queries', () => {
    expect(messageSchema.indexes).toContainEqual(['conversationId', 'createdAt'])
  })

  it('should have _pendingSend index for offline retry', () => {
    expect(messageSchema.indexes).toContainEqual('_pendingSend')
  })

  it('should have updatedAt index for sync', () => {
    expect(messageSchema.indexes).toContainEqual('updatedAt')
  })

  it('should define all content fields', () => {
    expect(messageSchema.properties).toHaveProperty('contentType')
    expect(messageSchema.properties).toHaveProperty('contentText')
    expect(messageSchema.properties).toHaveProperty('contentUri')
    expect(messageSchema.properties).toHaveProperty('contentMimeType')
    expect(messageSchema.properties).toHaveProperty('contentFileName')
  })

  it('should define v0.3.0 fields', () => {
    expect(messageSchema.properties).toHaveProperty('editedAt')
    expect(messageSchema.properties).toHaveProperty('editedById')
    expect(messageSchema.properties).toHaveProperty('updatedAt')
    expect(messageSchema.properties).toHaveProperty('systemType')
  })
})

describe('conversationSchema', () => {
  it('should have correct primary key', () => {
    expect(conversationSchema.primaryKey).toBe('id')
  })

  it('should have correct version', () => {
    expect(conversationSchema.version).toBe(0)
  })

  it('should have required fields', () => {
    expect(conversationSchema.required).toContain('id')
    expect(conversationSchema.required).toContain('type')
    expect(conversationSchema.required).toContain('unreadCount')
    expect(conversationSchema.required).toContain('muted')
    expect(conversationSchema.required).toContain('pinned')
  })

  it('should have type index for filtering', () => {
    expect(conversationSchema.indexes).toContainEqual('type')
  })

  it('should have updatedAt index for sorting', () => {
    expect(conversationSchema.indexes).toContainEqual('updatedAt')
  })

  it('should have _syncedAt index for sync tracking', () => {
    expect(conversationSchema.indexes).toContainEqual('_syncedAt')
  })

  it('should define v0.3.0 fields', () => {
    expect(conversationSchema.properties).toHaveProperty('topic')
    expect(conversationSchema.properties).toHaveProperty('description')
    expect(conversationSchema.properties).toHaveProperty('metadata')
  })

  it('should define last message fields', () => {
    expect(conversationSchema.properties).toHaveProperty('lastMessageId')
    expect(conversationSchema.properties).toHaveProperty('lastMessageText')
    expect(conversationSchema.properties).toHaveProperty('lastMessageAt')
  })
})

describe('syncCheckpointSchema', () => {
  it('should have correct primary key', () => {
    expect(syncCheckpointSchema.primaryKey).toBe('id')
  })

  it('should have correct version', () => {
    expect(syncCheckpointSchema.version).toBe(0)
  })

  it('should have required fields', () => {
    expect(syncCheckpointSchema.required).toContain('id')
    expect(syncCheckpointSchema.required).toContain('updatedAt')
    expect(syncCheckpointSchema.required).toContain('syncedAt')
  })

  it('should define checkpoint fields', () => {
    expect(syncCheckpointSchema.properties).toHaveProperty('updatedAt')
    expect(syncCheckpointSchema.properties).toHaveProperty('syncedAt')
  })
})
