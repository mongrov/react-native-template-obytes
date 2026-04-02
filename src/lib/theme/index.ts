import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';

import { storage } from '@/lib/storage';

export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'color-scheme';

function resolveScheme(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme === 'system')
    return Appearance.getColorScheme() ?? 'light';
  return scheme;
}

// Read initial value from storage
const initialScheme = (storage.getString(STORAGE_KEY) as ColorScheme) ?? 'system';

// Initialize Uniwind on module load
Uniwind.setTheme(initialScheme);

type ThemeState = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const useThemeStore = create<ThemeState>(set => ({
  colorScheme: initialScheme,
  setColorScheme: (scheme: ColorScheme) => {
    storage.set(STORAGE_KEY, scheme);
    Uniwind.setTheme(scheme);
    set({ colorScheme: scheme });
  },
}));

export function useColorScheme() {
  const colorScheme = useThemeStore(state => state.colorScheme);
  const setColorScheme = useThemeStore(state => state.setColorScheme);
  const resolved = resolveScheme(colorScheme);
  const isDark = resolved === 'dark';

  return { colorScheme, setColorScheme, isDark };
}

export function useNavigationTheme() {
  const { isDark } = useColorScheme();
  return isDark ? DarkTheme : DefaultTheme;
}
