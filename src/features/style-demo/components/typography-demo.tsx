import * as React from 'react';

import { Card, CardContent, Text, View } from '@/components/ui';

import { Title } from './title';

export function Typography() {
  return (
    <>
      <Title text="Typography" />
      <Card className="mb-4">
        <CardContent className="gap-4">
          <View>
            <Text variant="muted" className="mb-1">variant="h1"</Text>
            <Text variant="h1">Heading 1</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="h2"</Text>
            <Text variant="h2" className="border-0">Heading 2</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="h3"</Text>
            <Text variant="h3">Heading 3</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="h4"</Text>
            <Text variant="h4">Heading 4</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="p"</Text>
            <Text variant="p" className="mt-0">
              This is a paragraph. Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Cumque quasi aut, expedita tempore ratione quidem in.
            </Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="lead"</Text>
            <Text variant="lead">A lead paragraph stands out from regular text.</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="large"</Text>
            <Text variant="large">Large text for emphasis</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="small"</Text>
            <Text variant="small">Small text for fine print</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="muted"</Text>
            <Text variant="muted">Muted text for secondary content</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="code"</Text>
            <Text variant="code">const code = "inline";</Text>
          </View>
          <View>
            <Text variant="muted" className="mb-1">variant="blockquote"</Text>
            <Text variant="blockquote" className="mt-0">
              "The only way to do great work is to love what you do."
            </Text>
          </View>
        </CardContent>
      </Card>
    </>
  );
}
