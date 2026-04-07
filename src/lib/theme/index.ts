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

// Lazy initialization - read from storage only when first accessed
let _initialized = false;
let _initialScheme: ColorScheme = 'system';

function getInitialScheme(): ColorScheme {
  if (!_initialized) {
    _initialized = true;
    try {
      const stored = storage.getString(STORAGE_KEY) as ColorScheme | undefined;
      if (stored) {
        _initialScheme = stored;
      }
      Uniwind.setTheme(_initialScheme);
    } catch {
      // Native module not ready yet, use default
      _initialScheme = 'system';
    }
  }
  return _initialScheme;
}

type ThemeState = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: getInitialScheme(),
  setColorScheme: (scheme: ColorScheme) => {
    try {
      storage.set(STORAGE_KEY, scheme);
    } catch {
      // Ignore storage errors
    }
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
