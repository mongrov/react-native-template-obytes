import type { LogLevel } from '@mongrov/core';
import * as React from 'react';
import { Text, TouchableOpacity, View } from '@/components/ui';

const LEVELS: (LogLevel | 'all')[] = ['all', 'debug', 'info', 'warn', 'error'];

type LogFilterBarProps = {
  activeLevel: LogLevel | undefined;
  onSelectLevel: (level: LogLevel | undefined) => void;
};

export function LogFilterBar({ activeLevel, onSelectLevel }: LogFilterBarProps) {
  return (
    <View className="flex-row gap-2 px-4 py-2">
      {LEVELS.map((level) => {
        const isActive
          = level === 'all' ? !activeLevel : activeLevel === level;
        return (
          <TouchableOpacity
            key={level}
            onPress={() => onSelectLevel(level === 'all' ? undefined : level)}
            className={`rounded-full px-3 py-1 ${
              isActive
                ? 'bg-blue-500'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <Text
              className={`text-xs font-medium uppercase ${
                isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {level}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
