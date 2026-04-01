import type { OptionType } from '@/components/ui';

import type { ColorScheme } from '@/lib/theme';
import * as React from 'react';
import { Options, useModal } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useColorScheme } from '@/lib/theme';

import { SettingsItem } from './settings-item';

export function ThemeItem() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setColorScheme(option.value as ColorScheme);
      modal.dismiss();
    },
    [setColorScheme, modal],
  );

  const themes = React.useMemo(
    () => [
      { label: `${translate('settings.theme.dark')} 🌙`, value: 'dark' },
      { label: `${translate('settings.theme.light')} 🌞`, value: 'light' },
      { label: `${translate('settings.theme.system')} ⚙️`, value: 'system' },
    ],
    [],
  );

  const theme = React.useMemo(
    () => themes.find(t => t.value === colorScheme),
    [colorScheme, themes],
  );

  return (
    <>
      <SettingsItem
        text="settings.theme.title"
        value={theme?.label}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
      />
    </>
  );
}
