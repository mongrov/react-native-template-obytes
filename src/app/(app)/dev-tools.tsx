import type { LogEntry, LogLevel } from '@mongrov/core';
import { useLogger } from '@mongrov/core';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Share, TextInput } from 'react-native';

import { Card, CardContent, CardHeader, CardTitle, FocusAwareStatusBar, Text, View } from '@/components/ui';

const LEVELS: (LogLevel | 'all')[] = ['all', 'debug', 'info', 'warn', 'error'];

const LEVEL_STYLES: Record<string, { badge: string; text: string; bg: string }> = {
  debug: {
    badge: 'bg-neutral-200 dark:bg-neutral-700',
    text: 'text-neutral-600 dark:text-neutral-300',
    bg: 'bg-neutral-50 dark:bg-neutral-900',
  },
  info: {
    badge: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
  },
  warn: {
    badge: 'bg-warning-100 dark:bg-warning-900',
    text: 'text-warning-600 dark:text-warning-400',
    bg: 'bg-warning-50 dark:bg-warning-950/50',
  },
  error: {
    badge: 'bg-danger-100 dark:bg-danger-900',
    text: 'text-danger-600 dark:text-danger-400',
    bg: 'bg-danger-50 dark:bg-danger-950/50',
  },
};

function FilterButton({
  level,
  isActive,
  onPress,
}: {
  level: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 ${
        isActive
          ? 'bg-primary-500 dark:bg-primary-600'
          : 'border border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800'
      }`}
    >
      <Text
        className={`text-xs font-semibold uppercase ${
          isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
        }`}
      >
        {level}
      </Text>
    </Pressable>
  );
}

function LogEntryItem({ entry }: { entry: LogEntry }) {
  const styles = LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.debug;
  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <View className={`border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 ${styles.bg}`}>
      <View className="mb-1 flex-row items-center justify-between">
        <View className={`rounded-sm px-2 py-0.5 ${styles.badge}`}>
          <Text className={`text-xs font-bold uppercase ${styles.text}`}>
            {entry.level}
          </Text>
        </View>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{time}</Text>
      </View>
      <Text className="text-sm text-neutral-900 dark:text-neutral-100">{entry.message}</Text>
      {entry.data && (
        <Text className="mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          {JSON.stringify(entry.data, null, 2).slice(0, 200)}
        </Text>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-lg font-medium text-neutral-500 dark:text-neutral-400">
        No logs yet
      </Text>
      <Text className="mt-2 text-center text-sm text-neutral-400 dark:text-neutral-500">
        Logs will appear here as the app generates them
      </Text>
    </View>
  );
}

export default function DevTools() {
  const logger = useLogger();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [activeLevel, setActiveLevel] = useState<LogLevel | undefined>(undefined);
  const [search, setSearch] = useState('');

  // Fetch logs and auto-refresh every 2 seconds
  useEffect(() => {
    const fetchLogs = () => {
      try {
        const logs = logger.getLogs({ level: activeLevel, search: search || undefined });
        setEntries(logs);
      }
      catch {
        setEntries([]);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [logger, activeLevel, search]);

  const handleExport = async () => {
    try {
      const data = logger.exportLogs({ level: activeLevel, search: search || undefined });
      await Share.share({
        message: data,
        title: 'App Logs',
      });
    }
    catch {
      // Share cancelled or failed
    }
  };

  const handleFilterSelect = (level: LogLevel | 'all') => {
    setActiveLevel(level === 'all' ? undefined : level);
  };

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 bg-white dark:bg-neutral-950">
        {/* Header */}
        <Card className="mx-4 mt-12 mb-4">
          <CardHeader className="pb-2">
            <View className="flex-row items-center justify-between">
              <CardTitle>Dev Tools</CardTitle>
              <Pressable
                onPress={handleExport}
                className="rounded-lg bg-primary-500 px-4 py-2 active:bg-primary-600 dark:bg-primary-600 dark:active:bg-primary-700"
              >
                <Text className="text-sm font-semibold text-white">Export</Text>
              </Pressable>
            </View>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Search Input */}
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search logs..."
              placeholderTextColor="#9ca3af"
              className="mb-3 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
            {/* Filter Bar */}
            <View className="flex-row flex-wrap gap-2">
              {LEVELS.map((level) => {
                const isActive = level === 'all' ? !activeLevel : activeLevel === level;
                return (
                  <FilterButton
                    key={level}
                    level={level}
                    isActive={isActive}
                    onPress={() => handleFilterSelect(level)}
                  />
                );
              })}
            </View>
            <Text className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              {entries.length}
              {' '}
              {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </CardContent>
        </Card>

        {/* Log List */}
        <View className="mx-4 mb-4 flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {entries.length === 0
            ? (
                <EmptyState />
              )
            : (
                <FlatList
                  data={entries}
                  renderItem={({ item }) => <LogEntryItem entry={item} />}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                />
              )}
        </View>
      </View>
    </>
  );
}
