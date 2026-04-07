import type { Message } from '@mongrov/types';
import { useSession } from '@mongrov/auth';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import { useCollab, useCollabConnected } from '@/lib/collab';
import type { SendMessageParams, PresenceState } from '@/lib/collab/adapters/rocketchat';

// Attachment type for pending uploads
interface PendingAttachment {
  uri: string;
  type: 'image' | 'file';
  mimeType?: string;
  fileName?: string;
}

// Typing indicator timeout (ms)
const TYPING_TIMEOUT = 3000;
const TYPING_DEBOUNCE = 1000;

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { adapter } = useCollab();
  const isConnected = useCollabConnected();
  const session = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [userPresence, setUserPresence] = useState<Map<string, PresenceState>>(new Map());

  const listRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!adapter || !isConnected || !id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await adapter.fetchMessages(id, { limit: 50 });
      // Messages come newest first, reverse for display (oldest at top)
      setMessages(result.messages.reverse());

      // Mark as read
      adapter.markAsRead(id).catch(() => {
        // Ignore mark as read errors
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [adapter, isConnected, id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!adapter || !isConnected || !id) return;

    // Subscribe to room messages and typing
    const unsubscribePromise = adapter.subscribeToConversation(id);

    // Handle new messages
    const unsubMessage = adapter.on('message:received', (message) => {
      if (message.conversationId === id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Scroll to bottom on new message
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Mark as read if from someone else
        if (message.sender.id !== currentUserId) {
          adapter.markAsRead(id).catch(() => {});
        }
      }
    });

    // Handle typing start
    const unsubTypingStart = adapter.on('typing:start', ({ conversationId, userId, userName }) => {
      if (conversationId === id && userId !== currentUserId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(userId, userName || userId);
          return next;
        });

        // Auto-remove after timeout
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
        }, TYPING_TIMEOUT);
      }
    });

    // Handle typing stop
    const unsubTypingStop = adapter.on('typing:stop', ({ conversationId, userId }) => {
      if (conversationId === id) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }
    });

    // Handle presence changes
    const unsubPresenceChanged = adapter.on('presence:changed', ({ userId, status }) => {
      setUserPresence((prev) => {
        const next = new Map(prev);
        next.set(userId, status);
        return next;
      });
    });

    const unsubPresenceOnline = adapter.on('presence:online', ({ userId }) => {
      setUserPresence((prev) => {
        const next = new Map(prev);
        next.set(userId, 'online');
        return next;
      });
    });

    const unsubPresenceOffline = adapter.on('presence:offline', ({ userId }) => {
      setUserPresence((prev) => {
        const next = new Map(prev);
        next.set(userId, 'offline');
        return next;
      });
    });

    return () => {
      unsubMessage();
      unsubTypingStart();
      unsubTypingStop();
      unsubPresenceChanged();
      unsubPresenceOnline();
      unsubPresenceOffline();
      unsubscribePromise.then((unsub) => unsub());
    };
  }, [adapter, isConnected, id, currentUserId]);

  // Subscribe to presence for users in conversation
  useEffect(() => {
    if (!adapter || !isConnected || messages.length === 0) return;

    // Get unique user IDs from messages (excluding current user)
    const userIds = [...new Set(
      messages
        .map((m) => m.sender.id)
        .filter((uid) => uid !== currentUserId)
    )];

    if (userIds.length === 0) return;

    // Subscribe to presence updates
    const unsubPromise = adapter.subscribeToPresence(userIds);

    return () => {
      unsubPromise.then((unsub) => unsub()).catch(() => {});
    };
  }, [adapter, isConnected, messages, currentUserId]);

  // Update header title with conversation name
  useLayoutEffect(() => {
    if (id) {
      navigation.setOptions({
        title: id,
      });
    }
  }, [navigation, id]);

  // Handle text input change with typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (!adapter || !id || !text.trim()) {
        return;
      }

      // Debounce typing indicator
      const now = Date.now();
      if (now - lastTypingSentRef.current > TYPING_DEBOUNCE) {
        lastTypingSentRef.current = now;
        adapter.sendTyping(id, true).catch(() => {});

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Send stop typing after timeout
        typingTimeoutRef.current = setTimeout(() => {
          adapter.sendTyping(id, false).catch(() => {});
        }, TYPING_TIMEOUT);
      }
    },
    [adapter, id]
  );

  // Pick an image from camera roll or camera
  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant access to your photo library to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingAttachment({
        uri: asset.uri,
        type: 'image',
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `image-${Date.now()}.jpg`,
      });
    }
  }, []);

  // Pick a document
  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingAttachment({
        uri: asset.uri,
        type: 'file',
        mimeType: asset.mimeType || 'application/octet-stream',
        fileName: asset.name,
      });
    }
  }, []);

  // Show attachment options
  const handleAttachmentPress = useCallback(() => {
    Alert.alert(
      'Add Attachment',
      'Choose an attachment type',
      [
        { text: 'Photo', onPress: handlePickImage },
        { text: 'Document', onPress: handlePickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handlePickImage, handlePickDocument]);

  // Clear pending attachment
  const clearAttachment = useCallback(() => {
    setPendingAttachment(null);
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!adapter || !isConnected || !id || (!inputText.trim() && !pendingAttachment)) return;

    const trimmedText = inputText.trim();
    setInputText('');
    setSending(true);

    // Stop typing indicator
    adapter.sendTyping(id, false).catch(() => {});
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear attachment before sending
    const attachment = pendingAttachment;
    setPendingAttachment(null);

    try {
      let params: SendMessageParams;

      if (attachment) {
        // Send attachment (with optional text caption)
        params = {
          conversationId: id,
          content: {
            type: attachment.type,
            uri: attachment.uri,
            mimeType: attachment.mimeType,
            fileName: attachment.fileName,
            text: trimmedText || undefined,
          },
        };
      } else {
        // Send text message
        params = {
          conversationId: id,
          content: {
            type: 'text',
            text: trimmedText,
          },
        };
      }

      const result = await adapter.sendMessage(params);

      // Add the sent message to the list (if not already added by subscription)
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message.id)) {
          return prev;
        }
        return [...prev, result.message];
      });

      // Scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      // Restore text and attachment on error
      setInputText(trimmedText);
      if (attachment) setPendingAttachment(attachment);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [adapter, isConnected, id, inputText, pendingAttachment]);

  // Format typing indicator text
  const typingText = useMemo(() => {
    const users = Array.from(typingUsers.values());
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users.length} people are typing...`;
  }, [typingUsers]);

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

  if (error && messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-red-500">{error}</Text>
        <Pressable onPress={loadMessages} className="mt-4">
          <Text className="text-primary-500">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages list */}
      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              presenceStatus={userPresence.get(item.sender.id)}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() => {
            // Auto-scroll to bottom on initial load
            if (messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      </View>

      {/* Typing indicator */}
      {typingText && (
        <View className="px-4 py-1">
          <Text className="text-xs italic text-neutral-500">{typingText}</Text>
        </View>
      )}

      {/* Pending attachment preview */}
      {pendingAttachment && (
        <View className="border-t border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
          <View className="flex-row items-center">
            {pendingAttachment.type === 'image' ? (
              <Image
                source={{ uri: pendingAttachment.uri }}
                style={{ width: 60, height: 60, borderRadius: 8 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
                <Text className="text-2xl">📄</Text>
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-sm text-neutral-700 dark:text-neutral-300" numberOfLines={1}>
                {pendingAttachment.fileName || 'Attachment'}
              </Text>
              <Text className="text-xs text-neutral-500">
                {pendingAttachment.type === 'image' ? 'Image' : 'File'}
              </Text>
            </View>
            <Pressable
              onPress={clearAttachment}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700"
            >
              <Text className="text-neutral-600 dark:text-neutral-400">✕</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View className="flex-row items-end border-t border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
        {/* Attachment button */}
        <Pressable
          onPress={handleAttachmentPress}
          disabled={sending}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700"
        >
          <Text className="text-lg">+</Text>
        </Pressable>

        <TextInput
          className="max-h-24 min-h-10 flex-1 rounded-2xl border border-neutral-300 bg-neutral-100 px-4 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          placeholder={pendingAttachment ? 'Add a caption...' : 'Type a message...'}
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={(!inputText.trim() && !pendingAttachment) || sending}
          className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-primary-500 disabled:opacity-50"
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-lg text-white">↑</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

interface MessageBubbleProps {
  message: Message;
  currentUserId?: string;
  presenceStatus?: PresenceState;
}

function MessageBubble({ message, currentUserId, presenceStatus }: MessageBubbleProps) {
  const isOwn = message.sender.id === currentUserId;
  const content = message.content;
  const text = content.text || '';

  return (
    <View
      className={`mx-4 my-1 max-w-[80%] ${isOwn ? 'self-end' : 'self-start'}`}
    >
      {/* Sender name with presence indicator for received messages */}
      {!isOwn && (
        <View className="mb-1 ml-2 flex-row items-center">
          <PresenceIndicator status={presenceStatus} />
          <Text className="text-xs text-neutral-500">
            {message.sender.name || message.sender.id}
          </Text>
        </View>
      )}

      <View
        className={`overflow-hidden rounded-2xl ${
          isOwn
            ? 'rounded-br-sm bg-primary-500'
            : 'rounded-bl-sm bg-neutral-200 dark:bg-neutral-700'
        } ${content.type === 'image' ? '' : 'px-4 py-2'}`}
      >
        {content.type === 'text' && (
          <Text className={isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>
            {text}
          </Text>
        )}

        {content.type === 'image' && (
          <View>
            {content.uri && (
              <Image
                source={{ uri: content.uri }}
                style={{ width: 200, height: 200 }}
                contentFit="cover"
              />
            )}
            {text && (
              <View className="px-4 py-2">
                <Text className={isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>
                  {text}
                </Text>
              </View>
            )}
          </View>
        )}

        {content.type === 'file' && (
          <View className="flex-row items-center">
            <Text className="mr-2 text-2xl">📄</Text>
            <View className="flex-1">
              <Text className={isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'} numberOfLines={1}>
                {content.fileName || 'attachment'}
              </Text>
              {text && (
                <Text className={isOwn ? 'text-white/80' : 'text-neutral-600 dark:text-neutral-400'}>
                  {text}
                </Text>
              )}
            </View>
          </View>
        )}

        {content.type === 'audio' && (
          <View className="flex-row items-center">
            <Text className="mr-2 text-2xl">🎵</Text>
            <Text className={isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>
              Audio message
            </Text>
          </View>
        )}

        {content.type === 'video' && (
          <View className="flex-row items-center">
            <Text className="mr-2 text-2xl">🎬</Text>
            <Text className={isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>
              Video
            </Text>
          </View>
        )}

        {content.type === 'location' && (
          <Text className="italic text-neutral-500">[Location]</Text>
        )}
      </View>

      {/* Timestamp and delivery status */}
      <View className={`mt-1 flex-row items-center ${isOwn ? 'justify-end mr-2' : 'ml-2'}`}>
        <Text className="text-xs text-neutral-400">
          {formatMessageTime(message.createdAt)}
        </Text>
        {isOwn && message.deliveryStatus && (
          <DeliveryStatusIcon status={message.deliveryStatus} />
        )}
      </View>
    </View>
  );
}

interface DeliveryStatusIconProps {
  status: Message['deliveryStatus'];
}

function DeliveryStatusIcon({ status }: DeliveryStatusIconProps) {
  let icon = '';
  let color = 'text-neutral-400';

  switch (status) {
    case 'sending':
      icon = '○';
      break;
    case 'sent':
      icon = '✓';
      break;
    case 'delivered':
      icon = '✓✓';
      color = 'text-neutral-500';
      break;
    case 'read':
      icon = '✓✓';
      color = 'text-primary-500';
      break;
    case 'failed':
      icon = '!';
      color = 'text-red-500';
      break;
    default:
      return null;
  }

  return (
    <Text className={`ml-1 text-xs ${color}`}>{icon}</Text>
  );
}

interface PresenceIndicatorProps {
  status?: PresenceState;
}

function PresenceIndicator({ status }: PresenceIndicatorProps) {
  if (!status) return null;

  let bgColor = 'bg-neutral-400'; // default/offline

  switch (status) {
    case 'online':
      bgColor = 'bg-green-500';
      break;
    case 'away':
      bgColor = 'bg-yellow-500';
      break;
    case 'busy':
      bgColor = 'bg-red-500';
      break;
    case 'offline':
      bgColor = 'bg-neutral-400';
      break;
  }

  return (
    <View className={`mr-1.5 h-2 w-2 rounded-full ${bgColor}`} />
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
