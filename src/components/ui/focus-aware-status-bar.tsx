import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useColorScheme } from '@/lib/theme';

type Props = { hidden?: boolean };
export function FocusAwareStatusBar({ hidden = false }: Props) {
  const isFocused = useIsFocused();
  const { isDark } = useColorScheme();

  if (Platform.OS === 'web')
    return null;

  return isFocused
    ? (
        <SystemBars
          style={isDark ? 'light' : 'dark'}
          hidden={hidden}
        />
      )
    : null;
}
