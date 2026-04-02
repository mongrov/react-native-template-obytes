import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Pressable, Text, View } from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  isLast?: boolean;
  destructive?: boolean;
};

export function SettingsItem({ text, value, icon, onPress, isLast = false, destructive = false }: ItemProps) {
  const isPressable = onPress !== undefined;
  return (
    <Pressable
      onPress={onPress}
      pointerEvents={isPressable ? 'auto' : 'none'}
      className={cn(
        'flex-row items-center justify-between px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800',
        !isLast && 'border-b border-neutral-200 dark:border-neutral-700',
      )}
    >
      <View className="flex-row items-center gap-3">
        {icon && <View>{icon}</View>}
        <Text className={cn(destructive && 'text-danger-500')}>
          {translate(text)}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && <Text variant="muted">{value}</Text>}
        {isPressable && !destructive && (
          <ArrowRight className="text-neutral-400 dark:text-neutral-500" />
        )}
      </View>
    </Pressable>
  );
}
