import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';
import { storage } from '@/lib/storage';

export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'color-scheme';

function getPersistedScheme(): ColorScheme {
  return (storage.getString(STORAGE_KEY) as ColorScheme) ?? 'system';
}

function resolveScheme(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme === 'system')
    return Appearance.getColorScheme() ?? 'light';
  return scheme;
}

export function useColorScheme() {
  const [colorScheme, setColorSchemeState] = useState(getPersistedScheme);
  const resolved = resolveScheme(colorScheme);
  const isDark = resolved === 'dark';

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    storage.set(STORAGE_KEY, scheme);
    setColorSchemeState(scheme);
    Uniwind.setTheme(scheme);
  }, []);

  // Apply persisted theme on mount
  useEffect(() => {
    Uniwind.setTheme(colorScheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { colorScheme, setColorScheme, isDark };
}

export function useNavigationTheme() {
  const { isDark } = useColorScheme();
  return isDark ? DarkTheme : DefaultTheme;
}
