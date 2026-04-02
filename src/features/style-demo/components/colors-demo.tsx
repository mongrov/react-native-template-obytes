import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

import { Title } from './title';

type ColorName = keyof typeof colors;

export function Colors() {
  return (
    <>
      <Title text="Colors" />
      {(Object.keys(colors) as ColorName[]).map(name => (
        <ColorPalette name={name} key={name} />
      ))}
    </>
  );
}

function ColorPalette({ name }: { name: ColorName }) {
  if (typeof colors[name] === 'string')
    return null;
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{name.charAt(0).toUpperCase() + name.slice(1)}</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap gap-1">
          {Object.entries(colors[name]).map(([key, value]) => (
            <ColorSwatch
              key={`${name}-${key}`}
              shade={key}
              color={value}
            />
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

function ColorSwatch({ color, shade }: { shade: string; color: string }) {
  return (
    <View className="items-center">
      <View
        className="size-10 rounded-md border border-neutral-200 dark:border-neutral-700"
        style={{ backgroundColor: color }}
      />
      <Text variant="small" className="mt-1">{shade}</Text>
    </View>
  );
}
