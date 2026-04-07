import type { Message } from '@mongrov/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { FlatList, TextInput } from 'react-native';

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import { useCollab, useCollabConnected } from '@/lib/collab';

export default function SearchScreen() {
  const router = useRouter();
  const { adapter } = useCollab();
  const isConnected = useCollabConnected();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!adapter || !isConnected || !query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const messages = await adapter.searchMessages(query.trim(), { limit: 50 });
      setResults(messages);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [adapter, isConnected, query]);

  const handleResultPress = useCallback(
    (message: Message) => {
      // Navigate to the conversation containing this message
      router.push(`/chat/${message.conversationId}`);
    },
    [router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
  }, []);

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-neutral-500">
          Not connected to chat server
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      {/* Search bar */}
      <View className="flex-row items-center border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <View className="flex-1 flex-row items-center rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
          <Text className="mr-2 text-neutral-500">🔍</Text>
          <TextInput
            className="flex-1 text-neutral-900 dark:text-white"
            placeholder="Search messages..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear}>
              <Text className="text-neutral-500">✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleSearch} className="ml-3">
          <Text className="font-medium text-primary-500">Search</Text>
        </Pressable>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-neutral-500">Searching...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-2xl">🔍</Text>
          <Text className="mt-2 text-neutral-500">No messages found</Text>
          <Text className="text-sm text-neutral-400">
            Try a different search term
          </Text>
        </View>
      ) : !searched ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-2xl">💬</Text>
          <Text className="mt-2 text-neutral-500">Search messages</Text>
          <Text className="text-sm text-neutral-400">
            Enter a search term above
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultItem message={item} onPress={handleResultPress} />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
}

interface SearchResultItemProps {
  message: Message;
  onPress: (message: Message) => void;
}

function SearchResultItem({ message, onPress }: SearchResultItemProps) {
  const handlePress = useCallback(() => {
    onPress(message);
  }, [message, onPress]);

  const text = message.content.text || '';
  const senderName = message.sender.name || message.sender.id;
  const time = formatTime(message.createdAt);

  return (
    <Pressable
      onPress={handlePress}
      className="border-b border-neutral-100 px-4 py-3 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {senderName}
        </Text>
        <Text className="text-xs text-neutral-500">{time}</Text>
      </View>
      <Text
        className="mt-1 text-neutral-600 dark:text-neutral-400"
        numberOfLines={2}
      >
        {text}
      </Text>
    </Pressable>
  );
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
