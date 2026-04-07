import { Link, Stack } from 'expo-router';
import * as React from 'react';

import { Pressable, Text } from '@/components/ui';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Conversations',
          headerRight: () => <SearchButton />,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search Messages',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Chat',
        }}
      />
    </Stack>
  );
}

function SearchButton() {
  return (
    <Link href="/chat/search" asChild>
      <Pressable className="p-2">
        <Text className="text-lg">🔍</Text>
      </Pressable>
    </Link>
  );
}
