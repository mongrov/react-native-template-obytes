import { createTheme } from '@mongrov/theme';

// App brand overrides — customize per product
// Using existing primary orange from colors.js
export const appTheme = createTheme({
  overrides: {
    light: {
      colors: {
        primary: '#FF6C00',
        primaryForeground: '#FFFFFF',
      },
    },
    dark: {
      colors: {
        primary: '#FFA766',
        primaryForeground: '#1E1E1E',
      },
    },
  },
});

// Re-export for app consumption
export { useColorScheme, useTheme } from '@mongrov/theme';
export type { ColorScheme, Theme } from '@mongrov/theme';
