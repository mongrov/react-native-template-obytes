import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Card, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
};

export function SettingsContainer({ children, title }: Props) {
  return (
    <View className="mt-4">
      {title && <Text className="pb-2 text-lg font-medium">{translate(title)}</Text>}
      <Card className="gap-0 overflow-hidden py-0">
        {children}
      </Card>
    </View>
  );
}
