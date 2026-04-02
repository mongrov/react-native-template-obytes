import type { Post } from './api';
import { FlashList } from '@shopify/flash-list';

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
import { usePosts } from './api';
import { PostCard } from './components/post-card';

function PostCardSkeleton() {
  return (
    <Card className="m-2 overflow-hidden py-0">
      <Skeleton className="h-56 w-full rounded-t-xl rounded-b-none" />
      <CardHeader className="py-3">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="pb-4">
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </View>
  );
}

function ErrorState() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4 dark:bg-neutral-950">
      <Text variant="h4" className="mb-2">Something went wrong</Text>
      <Text variant="muted">Error loading posts. Please try again.</Text>
    </View>
  );
}

export function FeedScreen() {
  const { data, isPending, isError } = usePosts();
  const renderItem = React.useCallback(
    ({ item }: { item: Post }) => <PostCard {...item} />,
    [],
  );

  if (isPending) {
    return (
      <>
        <FocusAwareStatusBar />
        <LoadingState />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <FocusAwareStatusBar />
        <ErrorState />
      </>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FocusAwareStatusBar />
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
      />
    </View>
  );
}
