/**
 * RocketChat response types for REST API
 *
 * Slim interfaces matching RC REST API responses.
 * Reference: github.com/RocketChat/Rocket.Chat-Open-API
 */

// --- RC User ---

export interface RCUser {
  _id: string
  username: string
  name?: string
}

export interface RCMention {
  _id: string
  username: string
  name?: string
  type?: string
}

// --- RC Attachments & Files ---

export interface RCAttachment {
  title?: string
  title_link?: string
  text?: string
  image_url?: string
  audio_url?: string
  video_url?: string
  type?: string
  description?: string
}

export interface RCFile {
  _id: string
  name: string
  type: string
  size?: number
  url?: string
}

export interface RCUrlMeta {
  url: string
  meta?: Record<string, string>
  headers?: Record<string, string>
}

// --- RC Message ---

export interface RCMessage {
  _id: string
  rid: string
  msg: string
  ts: string // ISO date
  u: RCUser
  _updatedAt: string
  tmid?: string // thread parent
  t?: string // system message type
  attachments?: RCAttachment[]
  files?: RCFile[]
  reactions?: Record<string, { usernames: string[] }>
  mentions?: RCMention[]
  starred?: { _id: string }[]
  pinned?: boolean
  pinnedAt?: string
  pinnedBy?: RCUser
  editedAt?: string
  editedBy?: RCUser
  urls?: RCUrlMeta[]
  tcount?: number // thread reply count
  tlm?: string // thread last message timestamp
  replies?: string[] // thread reply user IDs
  drid?: string // discussion room ID
  e2e?: 'pending' | 'done'
  groupable?: boolean
  _hidden?: boolean
}

// --- RC Room ---

export interface RCRoom {
  _id: string
  t: 'd' | 'c' | 'p' | 'l' | 'v' // d=DM, c=channel, p=private, l=livechat, v=voip
  name?: string
  fname?: string // friendly name
  topic?: string
  description?: string
  u?: RCUser // creator
  uids?: string[] // DM user IDs
  usernames?: string[] // DM usernames
  usersCount?: number
  lastMessage?: RCMessage
  lm?: string // last message timestamp
  msgs?: number // message count
  ro?: boolean // read-only
  archived?: boolean
  encrypted?: boolean
  broadcast?: boolean
  avatarETag?: string
  ts?: string // created timestamp
  prid?: string // parent room ID (for discussions)
  teamId?: string
  teamMain?: boolean
}

// --- RC Subscription (per-user room state) ---

export interface RCSubscription {
  _id: string
  rid: string
  u: RCUser
  open: boolean
  unread: number
  userMentions: number
  groupMentions: number
  t: string
  name?: string
  fname?: string
  ls?: string // last seen
  lr?: string // last reply read
  f?: boolean // favorite (maps to pinned)
  alert?: boolean
  roles?: string[]
  tunread?: string[] // thread unread message IDs
  archived?: boolean
}

// --- RC API Response Wrappers ---

export interface RCApiResponse<T> {
  success: boolean
  [key: string]: T | boolean | string | undefined
}

export interface RCRoomsResponse {
  success: boolean
  update: RCRoom[]
  remove: RCRoom[]
}

export interface RCSubscriptionsResponse {
  success: boolean
  update: RCSubscription[]
  remove: RCSubscription[]
}

export interface RCMessagesResponse {
  success: boolean
  messages: RCMessage[]
}

export interface RCSendMessageResponse {
  success: boolean
  message: RCMessage
}

export interface RCChannelMembersResponse {
  success: boolean
  members: RCUser[]
  count: number
  offset: number
  total: number
}
