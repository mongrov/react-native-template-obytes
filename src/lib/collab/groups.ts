import { zivaFetch } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChannelCreateRequest = {
  name: string;
  members?: string[];
  readOnly?: boolean;
  extraData?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ChannelJoinRequest = {
  roomId?: string;
  roomName?: string;
  joinCode?: string;
  [key: string]: unknown;
};

export type ChannelMember = {
  _id: string;
  username?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
};

export type ChannelMembersResponse = {
  success: boolean;
  members?: ChannelMember[];
  count?: number;
  total?: number;
  [key: string]: unknown;
};

export type Channel = {
  _id: string;
  name?: string;
  fname?: string;
  usersCount?: number;
  ts?: string;
  [key: string]: unknown;
};

export type ChannelsListResponse = {
  success: boolean;
  channels?: Channel[];
  count?: number;
  total?: number;
  [key: string]: unknown;
};

export type SendMessageRequest = {
  rid: string;
  msg: string;
  [key: string]: unknown;
};

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Create a wellness group channel — ported from rc/index.js L3379
 * POST /api/v1/channels.create
 */
export async function createWellnessGroup(data: ChannelCreateRequest): Promise<unknown> {
  return zivaFetch<unknown>('POST', '/channels.create', data);
}

/**
 * Join a channel with optional pin — ported from rc/index.js L3459
 * POST /api/v1/channels.join
 */
export async function joinChannel(data: ChannelJoinRequest): Promise<unknown> {
  return zivaFetch<unknown>('POST', '/channels.join', data);
}

/**
 * Get channel members — ported from rc/index.js L3407
 * GET /api/v1/channels.members
 */
export async function getChannelMembers(channelId: string): Promise<ChannelMembersResponse> {
  return zivaFetch<ChannelMembersResponse>('GET', '/channels.members', undefined, {
    roomId: channelId,
  });
}

/**
 * List channels by query — ported from rc/index.js L3432
 * GET /api/v1/channels.list
 */
export async function getChannelsList(query: object): Promise<ChannelsListResponse> {
  return zivaFetch<ChannelsListResponse>('GET', '/channels.list', undefined, {
    // zivaFetch() already uses URLSearchParams, so avoid pre-encoding.
    query: JSON.stringify(query),
  });
}

/**
 * Get channel message history — ported from rc/index.js
 * GET /api/v1/channels.history
 */
export async function getGroupMessages(
  roomId: string,
  params?: Record<string, string>,
): Promise<unknown> {
  return zivaFetch<unknown>('GET', '/channels.history', undefined, {
    roomId,
    ...params,
  });
}

/**
 * Send a message to a channel
 * POST /api/v1/chat.sendMessage
 */
export async function sendGroupMessage(data: SendMessageRequest): Promise<unknown> {
  return zivaFetch<unknown>('POST', '/chat.sendMessage', { message: data });
}
