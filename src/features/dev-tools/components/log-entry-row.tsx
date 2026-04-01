import type { LogEntry } from '@mongrov/core';
import * as React from 'react';
import { Text, View } from '@/components/ui';

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-neutral-400',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
};

const LEVEL_BG: Record<string, string> = {
  debug: 'bg-neutral-100 dark:bg-neutral-800',
  info: 'bg-blue-50 dark:bg-blue-950',
  warn: 'bg-yellow-50 dark:bg-yellow-950',
  error: 'bg-red-50 dark:bg-red-950',
};

export function LogEntryRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const levelColor = LEVEL_COLORS[entry.level] ?? 'text-neutral-500';
  const bgColor = LEVEL_BG[entry.level] ?? '';

  return (
    <View className={`border-b border-neutral-200 px-4 py-2 dark:border-neutral-700 ${bgColor}`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-xs font-bold uppercase ${levelColor}`}>
          {entry.level}
        </Text>
        <Text className="text-xs text-neutral-400">{time}</Text>
      </View>
      <Text className="mt-1 text-sm text-neutral-800 dark:text-neutral-200">
        {entry.message}
      </Text>
      {entry.data && (
        <Text className="mt-1 font-mono text-xs text-neutral-500">
          {JSON.stringify(entry.data, null, 2).slice(0, 200)}
        </Text>
      )}
    </View>
  );
}
