import type { LogEntry } from '@mongrov/core';
import { FlashList } from '@shopify/flash-list';
import * as React from 'react';
import { View } from '@/components/ui';
import { LogEntryRow } from './log-entry-row';

type LogViewerProps = {
  entries: LogEntry[];
};

export function LogViewer({ entries }: LogViewerProps) {
  return (
    <View className="flex-1">
      <FlashList
        data={entries}
        renderItem={({ item }) => <LogEntryRow entry={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
