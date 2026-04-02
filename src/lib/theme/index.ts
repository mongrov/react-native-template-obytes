import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useCallback, useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';
import { storage } from '@/lib/storage';

export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'color-scheme';

// Shared state store for theme
let currentScheme: ColorScheme = (storage.getString(STORAGE_KEY) as ColorScheme) ?? 'system';
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ColorScheme {
  return currentScheme;
}

function setScheme(scheme: ColorScheme) {
  currentScheme = scheme;
  storage.set(STORAGE_KEY, scheme);
  Uniwind.setTheme(scheme);
  emitChange();
}

function resolveScheme(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme === 'system')
    return Appearance.getColorScheme() ?? 'light';
  return scheme;
}

// Initialize Uniwind theme on module load
Uniwind.setTheme(currentScheme);

export function useColorScheme() {
  const colorScheme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const resolved = resolveScheme(colorScheme);
  const isDark = resolved === 'dark';

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setScheme(scheme);
  }, []);

  return { colorScheme, setColorScheme, isDark };
}

export function useNavigationTheme() {
  const { isDark } = useColorScheme();
  return isDark ? DarkTheme : DefaultTheme;
}
