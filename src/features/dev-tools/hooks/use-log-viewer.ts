import type { LogEntry, LogFilter, LogLevel } from '@mongrov/core';
import { useLogger } from '@mongrov/core';
import { useCallback, useState } from 'react';

export function useLogViewer() {
  const logger = useLogger();
  const [filter, setFilter] = useState<LogFilter>({});
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const refresh = useCallback(() => {
    try {
      const logs = logger.getLogs(filter);
      setEntries(logs);
    }
    catch {
      setEntries([]);
    }
  }, [logger, filter]);

  const setLevelFilter = useCallback(
    (level: LogLevel | undefined) => {
      setFilter(prev => ({ ...prev, level }));
    },
    [],
  );

  const setSearchFilter = useCallback(
    (search: string | undefined) => {
      setFilter(prev => ({ ...prev, search: search || undefined }));
    },
    [],
  );

  const exportLogs = useCallback((): string => {
    try {
      return logger.exportLogs(filter);
    }
    catch {
      return '[]';
    }
  }, [logger, filter]);

  return {
    entries,
    filter,
    refresh,
    setLevelFilter,
    setSearchFilter,
    exportLogs,
  };
}
