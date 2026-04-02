import * as React from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle, Text, View } from '@/components/ui';

import { Title } from './title';

export function Buttons() {
  return (
    <>
      <Title text="Buttons" />

      {/* Variants */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <Button label="Default" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Outline" variant="outline" />
          <Button label="Destructive" variant="destructive" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Link" variant="link" />
        </CardContent>
      </Card>

      {/* Sizes */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row flex-wrap items-center gap-2">
            <Button label="Small" size="sm" />
            <Button label="Default" size="default" />
            <Button label="Large" size="lg" />
          </View>
        </CardContent>
      </Card>

      {/* States */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>States</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <View>
            <Text variant="muted" className="mb-1">Loading</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button label="Loading" loading />
              <Button label="Loading" loading variant="outline" />
              <Button label="Loading" loading variant="secondary" />
            </View>
          </View>
          <View>
            <Text variant="muted" className="mb-1">Disabled</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button label="Disabled" disabled />
              <Button label="Disabled" disabled variant="outline" />
              <Button label="Disabled" disabled variant="secondary" />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* With Children */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>With Children</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <Button variant="outline">
            <Text>Custom Content</Text>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
