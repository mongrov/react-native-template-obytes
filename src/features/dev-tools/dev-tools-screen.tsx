import * as React from 'react';
import { useEffect } from 'react';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { LogExportButton } from './components/log-export-button';
import { LogFilterBar } from './components/log-filter-bar';
import { LogViewer } from './components/log-viewer';
import { useLogViewer } from './hooks/use-log-viewer';

export function DevToolsScreen() {
  const {
    entries,
    filter,
    refresh,
    setLevelFilter,
    exportLogs,
  } = useLogViewer();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 pt-12">
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text className="text-xl font-bold">Dev Tools</Text>
          <LogExportButton getExportData={exportLogs} />
        </View>

        <LogFilterBar
          activeLevel={filter.level}
          onSelectLevel={(level) => {
            setLevelFilter(level);
            // Refresh will be triggered by filter change on next render
            setTimeout(refresh, 0);
          }}
        />

        <Text className="px-4 py-1 text-xs text-neutral-400">
          {entries.length}
          {' '}
          entries
        </Text>

        <LogViewer entries={entries} />
      </View>
    </>
  );
}
