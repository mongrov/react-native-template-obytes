/**
 * Unit tests for RC → @mongrov/types mappers
 */

import {
  toParticipant,
  toMessageContent,
  toReactions,
  toMessage,
  toConversation,
  toAttachments,
  fromMessageContent,
} from '../mappers'
import type { RCMessage, RCUser, RCRoom, RCSubscription, RCFile } from '../types'

// --- Test Fixtures ---

const mockUser: RCUser = {
  _id: 'user-123',
  username: 'johndoe',
  name: 'John Doe',
}

const mockUserNoName: RCUser = {
  _id: 'user-456',
  username: 'janedoe',
}

const mockTextMessage: RCMessage = {
  _id: 'msg-1',
  rid: 'room-1',
  msg: 'Hello world',
  ts: '2026-04-06T10:00:00.000Z',
  u: mockUser,
  _updatedAt: '2026-04-06T10:00:00.000Z',
}

const mockImageFile: RCFile = {
  _id: 'file-1',
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 1024,
  url: 'https://example.com/photo.jpg',
}

const mockFileMessage: RCMessage = {
  _id: 'msg-2',
  rid: 'room-1',
  msg: 'Check this out',
  ts: '2026-04-06T11:00:00.000Z',
  u: mockUser,
  _updatedAt: '2026-04-06T11:00:00.000Z',
  files: [mockImageFile],
}

const mockRoom: RCRoom = {
  _id: 'room-1',
  t: 'c',
  name: 'general',
  fname: 'General Discussion',
  topic: 'General chat',
  description: 'A channel for general discussion',
  ts: '2026-01-01T00:00:00.000Z',
  lm: '2026-04-06T10:00:00.000Z',
}

const mockSubscription: RCSubscription = {
  _id: 'sub-1',
  rid: 'room-1',
  u: mockUser,
  open: true,
  unread: 5,
  userMentions: 2,
  groupMentions: 1,
  t: 'c',
  f: true,
}

// --- toParticipant Tests ---

describe('toParticipant', () => {
  it('should map user with name', () => {
    const result = toParticipant(mockUser)

    expect(result).toEqual({
      id: 'user-123',
      name: 'John Doe',
      avatar: undefined,
      type: 'human',
    })
  })

  it('should fallback to username when name is missing', () => {
    const result = toParticipant(mockUserNoName)

    expect(result).toEqual({
      id: 'user-456',
      name: 'janedoe',
      avatar: undefined,
      type: 'human',
    })
  })
})

// --- toMessageContent Tests ---

describe('toMessageContent', () => {
  it('should map text message', () => {
    const result = toMessageContent(mockTextMessage)

    expect(result).toEqual({
      type: 'text',
      text: 'Hello world',
    })
  })

  it('should map image file message', () => {
    const result = toMessageContent(mockFileMessage)

    expect(result).toEqual({
      type: 'image',
      text: 'Check this out',
      uri: 'https://example.com/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
    })
  })

  it('should map audio file message', () => {
    const audioMessage: RCMessage = {
      ...mockTextMessage,
      files: [{
        _id: 'file-2',
        name: 'voice.mp3',
        type: 'audio/mpeg',
        url: 'https://example.com/voice.mp3',
      }],
    }

    const result = toMessageContent(audioMessage)

    expect(result.type).toBe('audio')
    expect(result.mimeType).toBe('audio/mpeg')
  })

  it('should map video file message', () => {
    const videoMessage: RCMessage = {
      ...mockTextMessage,
      files: [{
        _id: 'file-3',
        name: 'video.mp4',
        type: 'video/mp4',
        url: 'https://example.com/video.mp4',
      }],
    }

    const result = toMessageContent(videoMessage)

    expect(result.type).toBe('video')
    expect(result.mimeType).toBe('video/mp4')
  })

  it('should map generic file message', () => {
    const fileMessage: RCMessage = {
      ...mockTextMessage,
      files: [{
        _id: 'file-4',
        name: 'doc.pdf',
        type: 'application/pdf',
        url: 'https://example.com/doc.pdf',
      }],
    }

    const result = toMessageContent(fileMessage)

    expect(result.type).toBe('file')
    expect(result.mimeType).toBe('application/pdf')
  })

  it('should map legacy attachment image', () => {
    const attachmentMessage: RCMessage = {
      ...mockTextMessage,
      attachments: [{
        image_url: 'https://example.com/legacy.jpg',
        title: 'Legacy Image',
      }],
    }

    const result = toMessageContent(attachmentMessage)

    expect(result.type).toBe('image')
    expect(result.uri).toBe('https://example.com/legacy.jpg')
  })

  it('should map empty message', () => {
    const emptyMessage: RCMessage = {
      ...mockTextMessage,
      msg: '',
    }

    const result = toMessageContent(emptyMessage)

    expect(result).toEqual({
      type: 'text',
      text: '',
    })
  })
})

// --- toReactions Tests ---

describe('toReactions', () => {
  it('should map reactions', () => {
    const rcReactions = {
      ':thumbsup:': { usernames: ['john', 'jane'] },
      ':heart:': { usernames: ['bob'] },
    }

    const result = toReactions(rcReactions)

    expect(result).toHaveLength(2)
    expect(result?.[0]).toEqual({
      emoji: 'thumbsup',
      userIds: ['john', 'jane'],
      count: 2,
    })
    expect(result?.[1]).toEqual({
      emoji: 'heart',
      userIds: ['bob'],
      count: 1,
    })
  })

  it('should return undefined for no reactions', () => {
    expect(toReactions(undefined)).toBeUndefined()
  })

  it('should handle empty reactions object', () => {
    const result = toReactions({})

    expect(result).toEqual([])
  })
})

// --- toAttachments Tests ---

describe('toAttachments', () => {
  it('should map RC files to attachments', () => {
    const files: RCFile[] = [mockImageFile]

    const result = toAttachments(files, undefined)

    expect(result).toHaveLength(1)
    expect(result?.[0]).toEqual({
      id: 'file-1',
      type: 'image',
      uri: 'https://example.com/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    })
  })

  it('should return undefined for no files', () => {
    expect(toAttachments(undefined, undefined)).toBeUndefined()
    expect(toAttachments([], [])).toBeUndefined()
  })
})

// --- toMessage Tests ---

describe('toMessage', () => {
  it('should map basic message', () => {
    const result = toMessage(mockTextMessage)

    expect(result.id).toBe('msg-1')
    expect(result.conversationId).toBe('room-1')
    expect(result.content).toEqual({ type: 'text', text: 'Hello world' })
    expect(result.sender.id).toBe('user-123')
    expect(result.deliveryStatus).toBe('delivered')
    expect(result.createdAt).toBe('2026-04-06T10:00:00.000Z')
  })

  it('should map message with files', () => {
    const result = toMessage(mockFileMessage)

    expect(result.content.type).toBe('image')
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments?.[0].fileName).toBe('photo.jpg')
  })

  it('should map message with mentions', () => {
    const messageWithMentions: RCMessage = {
      ...mockTextMessage,
      mentions: [
        { _id: 'user-1', username: 'alice' },
        { _id: 'user-2', username: 'bob' },
      ],
    }

    const result = toMessage(messageWithMentions)

    expect(result.mentions).toEqual(['user-1', 'user-2'])
  })

  it('should map thread parent message', () => {
    const threadMessage: RCMessage = {
      ...mockTextMessage,
      tmid: 'parent-msg-1',
    }

    const result = toMessage(threadMessage)

    expect(result.parentId).toBe('parent-msg-1')
  })

  it('should map system message', () => {
    const systemMessage: RCMessage = {
      ...mockTextMessage,
      t: 'uj', // user joined
      msg: 'John joined the channel',
    }

    const result = toMessage(systemMessage)

    expect(result.systemType).toBe('uj')
  })

  it('should map edited message', () => {
    const editedMessage: RCMessage = {
      ...mockTextMessage,
      editedAt: '2026-04-06T12:00:00.000Z',
      editedBy: mockUserNoName,
    }

    const result = toMessage(editedMessage)

    expect(result.editedAt).toBe('2026-04-06T12:00:00.000Z')
    expect(result.editedBy?.id).toBe('user-456')
  })

  it('should map RC-specific fields to metadata', () => {
    const messageWithMetadata: RCMessage = {
      ...mockTextMessage,
      pinned: true,
      pinnedAt: '2026-04-06T11:00:00.000Z',
      tcount: 5,
      e2e: 'done',
    }

    const result = toMessage(messageWithMetadata)

    expect(result.metadata?.pinned).toBe(true)
    expect(result.metadata?.pinnedAt).toBe('2026-04-06T11:00:00.000Z')
    expect(result.metadata?.tcount).toBe(5)
    expect(result.metadata?.e2e).toBe('done')
  })
})

// --- toConversation Tests ---

describe('toConversation', () => {
  it('should map channel room', () => {
    const result = toConversation(mockRoom, mockSubscription)

    expect(result.id).toBe('room-1')
    expect(result.type).toBe('channel')
    expect(result.name).toBe('General Discussion')
    expect(result.topic).toBe('General chat')
    expect(result.description).toBe('A channel for general discussion')
    expect(result.unreadCount).toBe(5)
    expect(result.pinned).toBe(true) // from subscription.f
  })

  it('should map DM room', () => {
    const dmRoom: RCRoom = {
      _id: 'dm-1',
      t: 'd',
      usernames: ['john', 'jane'],
      ts: '2026-01-01T00:00:00.000Z',
    }

    const result = toConversation(dmRoom)

    expect(result.type).toBe('1:1')
    expect(result.unreadCount).toBe(0) // no subscription
  })

  it('should map private group', () => {
    const groupRoom: RCRoom = {
      _id: 'group-1',
      t: 'p',
      name: 'private-team',
      ts: '2026-01-01T00:00:00.000Z',
    }

    const result = toConversation(groupRoom)

    expect(result.type).toBe('group')
  })

  it('should map archived room', () => {
    const archivedRoom: RCRoom = {
      ...mockRoom,
      archived: true,
    }

    const result = toConversation(archivedRoom)

    expect(result.groupState).toBe('archived')
  })

  it('should map read-only room', () => {
    const roRoom: RCRoom = {
      ...mockRoom,
      ro: true,
    }

    const result = toConversation(roRoom)

    expect(result.groupState).toBe('read-only')
  })

  it('should include avatar URL when baseUrl provided', () => {
    const roomWithAvatar: RCRoom = {
      ...mockRoom,
      avatarETag: 'abc123',
    }

    const result = toConversation(roomWithAvatar, undefined, 'https://chat.example.com')

    expect(result.avatar).toBe('https://chat.example.com/avatar/room/room-1?etag=abc123')
  })

  it('should map RC-specific fields to metadata', () => {
    const result = toConversation(mockRoom, mockSubscription)

    expect(result.metadata?.userMentions).toBe(2)
    expect(result.metadata?.groupMentions).toBe(1)
    expect(result.metadata?.lastSeen).toBeUndefined()
  })

  it('should handle room with lastMessage', () => {
    const roomWithLastMsg: RCRoom = {
      ...mockRoom,
      lastMessage: mockTextMessage,
    }

    const result = toConversation(roomWithLastMsg)

    expect(result.lastMessage).toBeDefined()
    expect(result.lastMessage?.id).toBe('msg-1')
    expect(result.lastMessage?.content.text).toBe('Hello world')
  })
})

// --- fromMessageContent Tests ---

describe('fromMessageContent', () => {
  it('should convert text content to RC payload', () => {
    const result = fromMessageContent('room-1', { type: 'text', text: 'Hello' })

    expect(result).toEqual({
      rid: 'room-1',
      msg: 'Hello',
      tmid: undefined,
    })
  })

  it('should include thread parent ID', () => {
    const result = fromMessageContent('room-1', { type: 'text', text: 'Reply' }, 'parent-1')

    expect(result.tmid).toBe('parent-1')
  })

  it('should handle empty text', () => {
    const result = fromMessageContent('room-1', { type: 'image', uri: 'https://example.com/img.jpg' })

    expect(result.msg).toBe('')
  })
})
