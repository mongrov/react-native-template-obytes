import type { OptionType } from '@/components/ui';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Radio,
  Select,
  Separator,
  Switch,
  View,
} from '@/components/ui';

import { Title } from './title';

const options: OptionType[] = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

export function Inputs() {
  const [value, setValue] = React.useState<string | number | undefined>();

  return (
    <>
      <Title text="Form" />

      {/* Text Inputs */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <Input label="Default" placeholder="Enter text..." />
          <Input label="With Error" error="This field is required" />
          <Input label="Disabled" placeholder="Disabled input" disabled />
        </CardContent>
      </Card>

      {/* Select */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Select</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            label="Choose a flavor"
            options={options}
            value={value}
            onSelect={option => setValue(option)}
            placeholder="Select an option..."
          />
        </CardContent>
      </Card>

      {/* Toggle Controls */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Toggle Controls</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <CheckboxExample />
          <Separator />
          <RadioExample />
          <Separator />
          <SwitchExample />
        </CardContent>
      </Card>
    </>
  );
}

function CheckboxExample() {
  const [checked, setChecked] = React.useState(false);
  return (
    <View>
      <Checkbox.Root
        checked={checked}
        onChange={setChecked}
        accessibilityLabel="Accept terms of condition"
      >
        <Checkbox.Icon checked={checked} />
        <Checkbox.Label text="I agree to the terms and conditions" />
      </Checkbox.Root>
    </View>
  );
}

function RadioExample() {
  const [selected, setSelected] = React.useState(false);
  return (
    <View>
      <Radio.Root
        checked={selected}
        onChange={setSelected}
        accessibilityLabel="Radio option"
      >
        <Radio.Icon checked={selected} />
        <Radio.Label text="Enable notifications" />
      </Radio.Root>
    </View>
  );
}

function SwitchExample() {
  const [active, setActive] = React.useState(false);
  return (
    <View>
      <Switch.Root
        checked={active}
        onChange={setActive}
        accessibilityLabel="Dark mode toggle"
      >
        <Switch.Icon checked={active} />
        <Switch.Label text="Dark mode" />
      </Switch.Root>
    </View>
  );
}
