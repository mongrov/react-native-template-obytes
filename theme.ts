/**
 * LuminX Care Theme Configuration
 * Based on the award-winning HTML design
 *
 * Use `useTheme` from `@/lib/theme` (Uniwind + app settings). This file stays free of
 * `nativewind` so Metro can bundle without that package.
 */

const lightColors = {
  // Primary Colors
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  primary500: '#1685FF',
  primary600: '#1271D8',
  primary700: '#0F5DB2',

  // Semantic Colors
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  critical: '#EF4444',
  criticalBg: '#FEE2E2',
  info: '#3B82F6',

  // Neutrals
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  bgElevated: '#FFFFFF',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  borderSubtle: '#F3F4F6',
  borderDefault: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

const darkColors = {
  // Primary Colors
  primary50: '#0F172A',
  primary100: '#1E293B',
  primary200: '#334155',
  primary500: '#1685FF',
  primary600: '#3B82F6',
  primary700: '#60A5FA',

  // Semantic Colors
  success: '#10B981',
  successBg: '#064E3B',
  warning: '#F59E0B',
  warningBg: '#78350F',
  critical: '#EF4444',
  criticalBg: '#7F1D1D',
  info: '#3B82F6',

  // Neutrals - Black backgrounds
  bgPrimary: '#000000',
  bgSecondary: '#0A0A0A',
  bgTertiary: '#141414',
  bgElevated: '#1A1A1A',

  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#000000',

  borderSubtle: '#1F1F1F',
  borderDefault: '#2A2A2A',
  borderStrong: '#3A3A3A',

  // Gray Scale - Dark mode
  gray50: '#1A1A1A',
  gray100: '#262626',
  gray200: '#333333',
  gray300: '#404040',
  gray400: '#6B6B6B',
  gray500: '#8B8B8B',
  gray600: '#A3A3A3',
  gray700: '#B8B8B8',
  gray800: '#D1D1D1',
  gray900: '#E5E5E5',
};

const baseTheme = {
  fonts: {
    // Display font (Cabinet Grotesk) - For titles and headings
    display: 'Cabinet Grotesk',
    displayThin: 'Cabinet Grotesk Thin',
    displayExtralight: 'Cabinet Grotesk Extralight',
    displayLight: 'Cabinet Grotesk Light',
    displayMedium: 'Cabinet Grotesk Medium',
    displayBold: 'Cabinet Grotesk Bold',
    displayExtrabold: 'Cabinet Grotesk Extrabold',
    displayBlack: 'Cabinet Grotesk Black',

    // Body font (Epilogue) - For all body text
    body: 'Epilogue',
    bodyThin: 'Epilogue Thin',
    bodyThinItalic: 'Epilogue Thin Italic',
    bodyExtralight: 'Epilogue ExtraLight',
    bodyExtralightItalic: 'Epilogue ExtraLight Italic',
    bodyLight: 'Epilogue Light',
    bodyLightItalic: 'Epilogue Light Italic',
    bodyMedium: 'Epilogue Medium',
    bodyMediumItalic: 'Epilogue Medium Italic',
    bodySemiBold: 'Epilogue SemiBold',
    bodySemiBoldItalic: 'Epilogue SemiBold Italic',
    bodyBold: 'Epilogue Bold',
    bodyBoldItalic: 'Epilogue Bold Italic',
    bodyExtrabold: 'Epilogue ExtraBold',
    bodyExtraboldItalic: 'Epilogue ExtraBold Italic',
    bodyBlack: 'Epilogue Black',
    bodyBlackItalic: 'Epilogue Black Italic',
    bodyItalic: 'Epilogue Italic',
  },

  shadows: {
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 15,
      elevation: 8,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 24,
  },
};

/** Theme tokens for a resolved light/dark appearance (matches app settings store when used with `@/lib/theme` `isDark`). */
export function getThemeForScheme(isDark: boolean) {
  return {
    ...baseTheme,
    colors: isDark ? darkColors : lightColors,
  };
}

// Static theme export for backward compatibility (defaults to light)
export const theme = {
  ...baseTheme,
  colors: lightColors,
};

export type Theme = typeof theme;
