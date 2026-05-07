import type { ChannelCreateRequest, ChannelJoinRequest, ChannelMembersResponse, ChannelsListResponse } from '../groups';

import { useCallback } from 'react';
import {
  createWellnessGroup,
  getChannelMembers,
  getChannelsList,
  joinChannel,

} from '../groups';
import { useCollabStore } from '../store';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UseWellnessGroupsResult = {
  createGroup: (data: ChannelCreateRequest) => Promise<unknown>;
  joinGroup: (data: ChannelJoinRequest) => Promise<unknown>;
  getGroupMembers: (channelId: string) => Promise<ChannelMembersResponse>;
  listGroups: (query?: Record<string, unknown>) => Promise<ChannelsListResponse>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Wellness group operations.
 * Ported from ziva_app wellnessGroupScreen.
 */
export function useWellnessGroups(): UseWellnessGroupsResult {
  const { isAuthenticated } = useCollabStore();

  const createGroup = useCallback(
    (data: ChannelCreateRequest): Promise<unknown> => {
      if (!isAuthenticated)
        throw new Error('Not authenticated');
      return createWellnessGroup(data);
    },
    [isAuthenticated],
  );

  const joinGroup = useCallback(
    (data: ChannelJoinRequest): Promise<unknown> => {
      if (!isAuthenticated)
        throw new Error('Not authenticated');
      return joinChannel(data);
    },
    [isAuthenticated],
  );

  const getGroupMembers = useCallback(
    (channelId: string): Promise<ChannelMembersResponse> => {
      if (!isAuthenticated)
        throw new Error('Not authenticated');
      return getChannelMembers(channelId);
    },
    [isAuthenticated],
  );

  const listGroups = useCallback(
    (query: Record<string, unknown> = {}): Promise<ChannelsListResponse> => {
      if (!isAuthenticated)
        throw new Error('Not authenticated');
      return getChannelsList(query);
    },
    [isAuthenticated],
  );

  return { createGroup, joinGroup, getGroupMembers, listGroups };
}
