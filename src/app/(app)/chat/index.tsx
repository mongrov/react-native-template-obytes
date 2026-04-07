import type { Conversation } from '@mongrov/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import { useCollab, useCollabConnected } from '@/lib/collab';
import type { PresenceState } from '@/lib/collab/adapters/rocketchat';

export default function ConversationsScreen() {
  const router = useRouter();
  const { adapter } = useCollab();
  const isConnected = useCollabConnected();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<Map<string, PresenceState>>(new Map());

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (!adapter || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const result = await adapter.fetchConversations({ limit: 50 });
      // Sort by last message time, most recent first
      const sorted = result.conversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.updatedAt || '';
        const bTime = b.lastMessage?.createdAt || b.updatedAt || '';
        return bTime.localeCompare(aTime);
      });
      setConversations(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adapter, isConnected]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!adapter || !isConnected) return;

    // Handle conversation updates (new messages, etc.)
    const unsubConversationUpdated = adapter.on('conversation:updated', (updatedConv) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === updatedConv.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedConv;
          // Re-sort by last message time
          return updated.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || a.updatedAt || '';
            const bTime = b.lastMessage?.createdAt || b.updatedAt || '';
            return bTime.localeCompare(aTime);
          });
        }
        return [updatedConv, ...prev];
      });
    });

    // Handle new conversations
    const unsubConversationJoined = adapter.on('conversation:joined', (newConv) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
    });

    // Handle presence changes
    const unsubPresence = adapter.on('presence:changed', ({ userId, status }) => {
      setUserPresence((prev) => {
        const next = new Map(prev);
        next.set(userId, status);
        return next;
      });
    });

    return () => {
      unsubConversationUpdated();
      unsubConversationJoined();
      unsubPresence();
    };
  }, [adapter, isConnected]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations(true);
  }, [loadConversations]);

  const handlePress = useCallback(
    (conversation: Conversation) => {
      router.push(`/chat/${conversation.id}`);
    },
    [router]
  );

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-neutral-500">
          Connecting to chat server...
        </Text>
        <ActivityIndicator className="mt-4" />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-red-500">{error}</Text>
        <Pressable onPress={() => loadConversations()} className="mt-4">
          <Text className="text-primary-500">Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Get presence status for a direct conversation
  const getPresenceForConversation = useCallback((conv: Conversation): PresenceState | undefined => {
    if (conv.type !== '1:1' || !conv.members) return undefined;
    // Find the other member in a direct conversation
    const otherMember = conv.members.find(m => m.user.id !== adapter?.id);
    if (otherMember) {
      return userPresence.get(otherMember.user.id);
    }
    return undefined;
  }, [adapter?.id, userPresence]);

  return (
    <View className="flex-1">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={handlePress}
            presenceStatus={getPresenceForConversation(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-neutral-500">No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
  presenceStatus?: PresenceState;
}

function ConversationItem({ conversation, onPress, presenceStatus }: ConversationItemProps) {
  const handlePress = useCallback(() => {
    onPress(conversation);
  }, [conversation, onPress]);

  const displayName = conversation.name || conversation.id;
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center border-b border-neutral-200 px-4 py-3 dark:border-neutral-700 ${hasUnread ? 'bg-primary-50 dark:bg-primary-950' : ''}`}
    >
      {/* Avatar with online indicator */}
      <View className="relative">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Text className="text-lg font-semibold text-primary-600 dark:text-primary-300">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        {presenceStatus === 'online' && (
          <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
        )}
      </View>

      {/* Content */}
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`flex-1 font-semibold ${hasUnread ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-neutral-100'}`}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {lastMessage && (
            <Text className={`ml-2 text-xs ${hasUnread ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-neutral-500'}`}>
              {formatTime(lastMessage.createdAt)}
            </Text>
          )}
        </View>

        <View className="mt-1 flex-row items-center">
          <Text
            className={`flex-1 text-sm ${hasUnread ? 'font-medium text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400'}`}
            numberOfLines={1}
          >
            {getMessagePreview(lastMessage)}
          </Text>
          {unreadCount > 0 && (
            <View className="ml-2 h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5">
              <Text className="text-xs font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Get message preview text based on content type
function getMessagePreview(message?: Conversation['lastMessage']): string {
  if (!message) return 'No messages yet';

  const content = message.content;
  switch (content.type) {
    case 'text':
      return content.text || '';
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎬 Video';
    case 'audio':
      return '🎵 Audio';
    case 'file':
      return `📄 ${content.fileName || 'File'}`;
    case 'location':
      return '📍 Location';
    default:
      return content.text || 'Message';
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
