import * as React from 'react';

import { Separator, Text, View } from '@/components/ui';

type Props = {
  text: string;
};

export function Title({ text }: Props) {
  return (
    <View className="flex-row items-center gap-3 py-4 pb-2">
      <Text variant="h4">{text}</Text>
      <Separator className="flex-1" />
    </View>
  );
}
