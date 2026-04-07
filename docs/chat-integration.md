# Chat Integration Guide

This guide covers the real-time chat system powered by `@mongrov/collab` with RocketChat backend.

## Overview

The chat system provides:
- Real-time messaging with WebSocket connection
- Conversation list with unread counts
- Typing indicators and presence status
- File uploads (images, documents)
- Message search across conversations
- Read receipts and delivery status

## Quick Start

### 1. Configure Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_RC_SERVER_URL=https://your-rocketchat-server.com
EXPO_PUBLIC_RC_WS_URL=wss://your-rocketchat-server.com/websocket
```

### 2. Use the CollabProvider

The provider is already set up in `src/app/_layout.tsx`. It initializes after authentication:

```typescript
import { CollabProvider } from '@/lib/collab';

function Providers({ children }) {
  return (
    <AuthProvider>
      <CollabProvider>
        {children}
      </CollabProvider>
    </AuthProvider>
  );
}
```

### 3. Access Chat Features

```typescript
import { useCollab, useCollabConnected } from '@/lib/collab';

function ChatScreen() {
  const { adapter } = useCollab();
  const isConnected = useCollabConnected();

  if (!isConnected) {
    return <Text>Connecting...</Text>;
  }

  // Use adapter methods
}
```

## Adapter API

### Conversations

```typescript
// Fetch conversations
const { conversations, hasMore } = await adapter.fetchConversations({
  limit: 50,
  offset: 0,
});

// Get single conversation
const conversation = await adapter.getConversation(conversationId);

// Create direct message
const dm = await adapter.createDirectMessage(userId);

// Create group
const group = await adapter.createGroup({
  name: 'My Group',
  members: ['user1', 'user2'],
});
```

### Messages

```typescript
// Fetch messages
const { messages, hasMore } = await adapter.fetchMessages(conversationId, {
  limit: 50,
  before: oldestMessageId,
});

// Send text message
await adapter.sendMessage(conversationId, {
  type: 'text',
  text: 'Hello!',
});

// Send image
await adapter.sendMessage(conversationId, {
  type: 'image',
  uri: 'file:///path/to/image.jpg',
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
});

// Send file
await adapter.sendMessage(conversationId, {
  type: 'file',
  uri: 'file:///path/to/document.pdf',
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
});

// Search messages
const results = await adapter.searchMessages('search term', {
  limit: 50,
});
```

### Real-Time Events

```typescript
// Subscribe to new messages
const unsubscribe = adapter.on('message:received', (message) => {
  console.log('New message:', message);
});

// Typing indicators
adapter.on('typing:start', ({ conversationId, userId, userName }) => {
  // Show typing indicator
});

adapter.on('typing:stop', ({ conversationId, userId }) => {
  // Hide typing indicator
});

// Presence changes
adapter.on('presence:changed', ({ userId, status }) => {
  // status: 'online' | 'away' | 'busy' | 'offline'
});

// Conversation updates
adapter.on('conversation:updated', (conversation) => {
  // Refresh conversation list
});

// Cleanup
unsubscribe();
```

### Typing & Read Status

```typescript
// Send typing indicator
adapter.sendTyping(conversationId, true);  // Start typing
adapter.sendTyping(conversationId, false); // Stop typing

// Mark messages as read
adapter.markAsRead(conversationId);
```

## Screen Implementations

### Conversation List (`/chat`)

```typescript
function ConversationsScreen() {
  const { adapter } = useCollab();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    const { conversations } = await adapter.fetchConversations({ limit: 50 });
    setConversations(conversations);
  };

  // Subscribe to updates
  useEffect(() => {
    const unsub = adapter.on('conversation:updated', (updated) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next.sort((a, b) =>
            (b.lastMessage?.createdAt || '').localeCompare(a.lastMessage?.createdAt || '')
          );
        }
        return [updated, ...prev];
      });
    });
    return unsub;
  }, [adapter]);

  return (
    <FlatList
      data={conversations}
      renderItem={({ item }) => (
        <ConversationItem
          conversation={item}
          onPress={() => router.push(`/chat/${item.id}`)}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadConversations} />
      }
    />
  );
}
```

### Chat Screen (`/chat/[id]`)

The starter uses `react-native-gifted-chat` for the message UI:

```typescript
function ChatScreen({ conversationId }) {
  const { adapter } = useCollab();
  const [messages, setMessages] = useState([]);

  // Load initial messages
  useEffect(() => {
    const load = async () => {
      const { messages } = await adapter.fetchMessages(conversationId, { limit: 50 });
      setMessages(messages.map(toGiftedMessage));
    };
    load();
  }, [conversationId]);

  // Subscribe to new messages
  useEffect(() => {
    const unsub = adapter.on('message:received', (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [toGiftedMessage(message), ...prev]);
      }
    });
    return unsub;
  }, [adapter, conversationId]);

  const onSend = async (newMessages) => {
    for (const msg of newMessages) {
      await adapter.sendMessage(conversationId, {
        type: 'text',
        text: msg.text,
      });
    }
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: adapter.id }}
    />
  );
}
```

### Message Search (`/chat/search`)

```typescript
function SearchScreen() {
  const { adapter } = useCollab();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const messages = await adapter.searchMessages(query, { limit: 50 });
    setResults(messages);
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        placeholder="Search messages..."
      />
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <SearchResultItem
            message={item}
            onPress={() => router.push(`/chat/${item.conversationId}`)}
          />
        )}
      />
    </View>
  );
}
```

## File Uploads

### Image Picker Integration

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const asset = result.assets[0];
    await adapter.sendMessage(conversationId, {
      type: 'image',
      uri: asset.uri,
      fileName: asset.fileName || 'image.jpg',
      mimeType: asset.mimeType || 'image/jpeg',
    });
  }
};
```

### Document Picker Integration

```typescript
import * as DocumentPicker from 'expo-document-picker';

const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
  });

  if (result.type === 'success') {
    await adapter.sendMessage(conversationId, {
      type: 'file',
      uri: result.uri,
      fileName: result.name,
      mimeType: result.mimeType || 'application/octet-stream',
    });
  }
};
```

## Message Types

| Type | Content Fields |
|------|----------------|
| `text` | `text` |
| `image` | `uri`, `fileName`, `mimeType`, `width?`, `height?` |
| `video` | `uri`, `fileName`, `mimeType`, `duration?` |
| `audio` | `uri`, `fileName`, `mimeType`, `duration?` |
| `file` | `uri`, `fileName`, `mimeType`, `size?` |
| `location` | `latitude`, `longitude`, `address?` |

## Presence Status

```typescript
// Get user presence
const presence = adapter.getUserPresence(userId);
// Returns: 'online' | 'away' | 'busy' | 'offline' | undefined

// Set your presence
adapter.setPresence('away');
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_RC_SERVER_URL` | RocketChat REST API URL |
| `EXPO_PUBLIC_RC_WS_URL` | RocketChat WebSocket URL |

## Troubleshooting

### "Not connected to chat server"

- Verify `EXPO_PUBLIC_RC_SERVER_URL` is correct
- Check WebSocket URL matches your server configuration
- Ensure user is authenticated before accessing chat

### "Messages not syncing"

- Check WebSocket connection status with `useCollabConnected()`
- Verify real-time subscriptions are set up
- Check server-side WebSocket configuration

### "File upload failed"

- Verify file size is within server limits
- Check file type is allowed by server
- Ensure proper permissions for file access

### "Typing indicator not showing"

- Verify both users are in the same conversation
- Check that typing events are being sent/received
- Ensure real-time connection is active
