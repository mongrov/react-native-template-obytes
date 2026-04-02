import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  FocusAwareStatusBar,
  Skeleton,
  Text,
  View,
} from '@/components/ui';
import { usePost } from './api';

function PostDetailSkeleton() {
  return (
    <View className="flex-1 bg-white p-3 dark:bg-neutral-950">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </View>
  );
}

function ErrorState() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4 dark:bg-neutral-950">
      <Text variant="h4" className="mb-2">Something went wrong</Text>
      <Text variant="muted">Error loading post. Please try again.</Text>
    </View>
  );
}

export function PostDetailScreen() {
  const local = useLocalSearchParams<{ id: string }>();

  const { data, isPending, isError } = usePost({
    variables: { id: local.id },
  });

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
        <FocusAwareStatusBar />
        <PostDetailSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
        <FocusAwareStatusBar />
        <ErrorState />
      </>
    );
  }

  return (
    <View className="flex-1 bg-white p-3 dark:bg-neutral-950">
      <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
      <FocusAwareStatusBar />
      <Card>
        <CardHeader>
          <Text variant="h3">{data.title}</Text>
        </CardHeader>
        <CardContent>
          <Text variant="p" className="mt-0">{data.body}</Text>
        </CardContent>
      </Card>
    </View>
  );
}
