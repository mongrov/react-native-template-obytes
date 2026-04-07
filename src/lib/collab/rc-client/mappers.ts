/**
 * RocketChat mappers — RC shapes → @mongrov/types
 *
 * Converts RC API responses to platform-agnostic types at the adapter boundary.
 * RC-specific fields that don't have @mongrov/types equivalents go into metadata bag.
 */

import type {
  Message,
  Participant,
  MessageContent,
  Reaction,
  Conversation,
  ConversationType,
  GroupState,
  Attachment,
} from '@mongrov/types'

import type {
  RCMessage,
  RCUser,
  RCRoom,
  RCSubscription,
  RCFile,
  RCAttachment,
} from './types'

// --- Participant Mapping ---

export function toParticipant(u: RCUser): Participant {
  return {
    id: u._id,
    name: u.name ?? u.username,
    avatar: undefined, // RC avatar fetched separately via /avatar/{username}
    type: 'human',
  }
}

// --- Message Content Mapping ---

export function toMessageContent(rc: RCMessage): MessageContent {
  // File/media message
  if (rc.files?.length) {
    const file = rc.files[0]
    const type = getContentTypeFromMime(file.type)
    return {
      type,
      text: rc.msg || undefined,
      uri: file.url,
      fileName: file.name,
      mimeType: file.type,
    }
  }

  // Attachment-based media (legacy RC format)
  if (rc.attachments?.length) {
    const att = rc.attachments[0]
    if (att.image_url) {
      return {
        type: 'image',
        text: rc.msg || undefined,
        uri: att.image_url,
      }
    }
    if (att.audio_url) {
      return {
        type: 'audio',
        text: rc.msg || undefined,
        uri: att.audio_url,
      }
    }
    if (att.video_url) {
      return {
        type: 'video',
        text: rc.msg || undefined,
        uri: att.video_url,
      }
    }
  }

  // Text message (default)
  return { type: 'text', text: rc.msg }
}

function getContentTypeFromMime(mimeType: string | undefined): MessageContent['type'] {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'file'
}

// --- Attachments Mapping ---

export function toAttachments(files: RCFile[] | undefined, attachments: RCAttachment[] | undefined): Attachment[] | undefined {
  const result: Attachment[] = []

  // Map RC files
  if (files?.length) {
    for (const file of files) {
      result.push({
        id: file._id,
        type: getAttachmentType(file.type),
        uri: file.url ?? '',
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      })
    }
  }

  // Map RC attachments (legacy format)
  if (attachments?.length) {
    for (const att of attachments) {
      const uri = att.image_url ?? att.audio_url ?? att.video_url ?? att.title_link
      if (uri) {
        result.push({
          id: uri, // No ID in RC attachments, use URI
          type: att.image_url ? 'image' : att.audio_url ? 'audio' : att.video_url ? 'video' : 'file',
          uri,
          fileName: att.title ?? '',
          mimeType: att.type ?? '',
        })
      }
    }
  }

  return result.length > 0 ? result : undefined
}

function getAttachmentType(mimeType: string | undefined): Attachment['type'] {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'file'
}

// --- Reactions Mapping ---

export function toReactions(
  rc: Record<string, { usernames: string[] }> | undefined
): Reaction[] | undefined {
  if (!rc) return undefined

  return Object.entries(rc).map(([emoji, { usernames }]) => ({
    emoji: emoji.replace(/:/g, ''), // RC uses :emoji: format
    userIds: usernames, // RC uses usernames, not IDs
    count: usernames.length,
  }))
}

// --- Message Mapping ---

export function toMessage(rc: RCMessage): Message {
  return {
    id: rc._id,
    conversationId: rc.rid,
    sender: toParticipant(rc.u),
    content: toMessageContent(rc),
    parentId: rc.tmid,
    attachments: toAttachments(rc.files, rc.attachments),
    reactions: toReactions(rc.reactions),
    mentions: rc.mentions?.map((m) => m._id),
    deliveryStatus: 'delivered',
    streaming: false,
    editedAt: rc.editedAt,
    editedBy: rc.editedBy ? toParticipant(rc.editedBy) : undefined,
    updatedAt: rc._updatedAt,
    systemType: rc.t,
    createdAt: rc.ts,
    metadata: {
      // RC-specific fields
      starred: rc.starred,
      pinned: rc.pinned,
      pinnedAt: rc.pinnedAt,
      pinnedBy: rc.pinnedBy,
      tcount: rc.tcount,
      tlm: rc.tlm,
      replies: rc.replies,
      drid: rc.drid,
      e2e: rc.e2e,
      urls: rc.urls,
      groupable: rc.groupable,
      hidden: rc._hidden,
    },
  }
}

// --- Conversation Mapping ---

function toConversationType(t: string): ConversationType {
  if (t === 'd') return '1:1'
  if (t === 'p') return 'group'
  return 'channel'
}

function toGroupState(room: RCRoom): GroupState {
  if (room.archived) return 'archived'
  if (room.ro) return 'read-only'
  return 'open'
}

export function toConversation(
  room: RCRoom,
  sub?: RCSubscription,
  baseUrl?: string
): Conversation {
  return {
    id: room._id,
    type: toConversationType(room.t),
    groupState: toGroupState(room),
    name: room.fname ?? room.name,
    avatar: room.avatarETag && baseUrl
      ? `${baseUrl}/avatar/room/${room._id}?etag=${room.avatarETag}`
      : undefined,
    members: [], // Fetched separately via /channels.members
    lastMessage: room.lastMessage ? toMessage(room.lastMessage) : undefined,
    unreadCount: sub?.unread ?? 0,
    muted: false, // Derived from user's notification prefs
    pinned: sub?.f ?? false, // RC "favorite" → our "pinned"
    topic: room.topic,
    description: room.description,
    createdAt: room.ts ?? '',
    updatedAt: room.lm ?? room.ts ?? '',
    metadata: {
      // RC-specific fields
      broadcast: room.broadcast,
      encrypted: room.encrypted,
      userMentions: sub?.userMentions,
      groupMentions: sub?.groupMentions,
      lastSeen: sub?.ls,
      teamId: room.teamId,
      teamMain: room.teamMain,
      prid: room.prid,
      usersCount: room.usersCount,
      msgCount: room.msgs,
    },
  }
}

// --- Reverse Mappers (for sending) ---

export interface RCSendMessagePayload {
  rid: string
  msg: string
  tmid?: string
}

export function fromMessageContent(
  conversationId: string,
  content: MessageContent,
  parentId?: string
): RCSendMessagePayload {
  return {
    rid: conversationId,
    msg: content.text ?? '',
    tmid: parentId,
  }
}

// --- Utility Exports ---

export function parseRCTimestamp(ts: string): Date {
  return new Date(ts)
}

export function formatRCTimestamp(date: Date): string {
  return date.toISOString()
}
