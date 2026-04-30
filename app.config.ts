import type { ConfigContext, ExpoConfig } from '@expo/config';

import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import 'tsx/cjs';

// adding lint exception as we need to import tsx/cjs before env.ts is imported

import Env from './env';

const EXPO_ACCOUNT_OWNER = 'obytes';
const EAS_PROJECT_ID = 'c3e1075b-6fe7-4686-aa49-35b46a229044';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.EXPO_PUBLIC_APP_ENV !== 'production',
  badges: [
    {
      text: Env.EXPO_PUBLIC_APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.EXPO_PUBLIC_VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

/** Cabinet Grotesk + Epilogue (LuminX Care) — embedded on iOS/Android via expo-font config plugin. */
const luminxCustomFontPaths = [
  './assets/fonts/CabinetGrotesk-Regular.otf',
  './assets/fonts/CabinetGrotesk-Thin.otf',
  './assets/fonts/CabinetGrotesk-Extralight.otf',
  './assets/fonts/CabinetGrotesk-Light.otf',
  './assets/fonts/CabinetGrotesk-Medium.otf',
  './assets/fonts/CabinetGrotesk-Bold.otf',
  './assets/fonts/CabinetGrotesk-Extrabold.otf',
  './assets/fonts/CabinetGrotesk-Black.otf',
  './assets/fonts/Epilogue-Regular.otf',
  './assets/fonts/Epilogue-Thin.otf',
  './assets/fonts/Epilogue-ThinItalic.otf',
  './assets/fonts/Epilogue-ExtraLight.otf',
  './assets/fonts/Epilogue-ExtraLightItalic.otf',
  './assets/fonts/Epilogue-Light.otf',
  './assets/fonts/Epilogue-LightItalic.otf',
  './assets/fonts/Epilogue-Medium.otf',
  './assets/fonts/Epilogue-MediumItalic.otf',
  './assets/fonts/Epilogue-SemiBold.otf',
  './assets/fonts/Epilogue-SemiBoldItalic.otf',
  './assets/fonts/Epilogue-Bold.otf',
  './assets/fonts/Epilogue-BoldItalic.otf',
  './assets/fonts/Epilogue-ExtraBold.otf',
  './assets/fonts/Epilogue-ExtraBoldItalic.otf',
  './assets/fonts/Epilogue-Black.otf',
  './assets/fonts/Epilogue-BlackItalic.otf',
  './assets/fonts/Epilogue-Italic.otf',
] as const;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.EXPO_PUBLIC_NAME,
  description: `${Env.EXPO_PUBLIC_NAME} Mobile App`,
  owner: EXPO_ACCOUNT_OWNER,
  scheme: Env.EXPO_PUBLIC_SCHEME,
  slug: 'obytesapp',
  version: Env.EXPO_PUBLIC_VERSION.toString(),
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.EXPO_PUBLIC_BUNDLE_ID,
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSBluetoothAlwaysUsageDescription: 'Allow ZivaOne to find and connect to your ZivaRing.',
      NSBluetoothPeripheralUsageDescription: 'Allow ZivaOne to communicate with your ZivaRing.',
    },
    // Configure associated domains for universal links (if domain is set)
    ...(Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN && {
      associatedDomains: [
        `applinks:${new URL(Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN).host}`,
      ],
    }),
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2E3C4B',
    },
    package: Env.EXPO_PUBLIC_PACKAGE,
    googleServicesFile: './google-services.json',
    // Configure intent filters for deep linking (if domain is set)
    ...(Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN && {
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: new URL(Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN).host,
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    }),
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2E3C4B',
        image: './assets/splash-icon.png',
        imageWidth: 150,
      },
    ],
    [
      'expo-font',
      {
        fonts: [...luminxCustomFontPaths],
        ios: {
          fonts: [
            'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
            'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
            'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
            'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
          ],
        },
        android: {
          fonts: [
            {
              fontFamily: 'Inter',
              fontDefinitions: [
                {
                  path: 'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
                  weight: 400,
                },
                {
                  path: 'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
                  weight: 500,
                },
                {
                  path: 'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
                  weight: 600,
                },
                {
                  path: 'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
                  weight: 700,
                },
              ],
            },
          ],
        },
      },
    ],
    'expo-localization',
    'expo-router',
    'expo-web-browser',
    ['app-icon-badge', appIconBadgeConfig],
    ['react-native-edge-to-edge'],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#FF6B35',
        sounds: [],
      },
    ],
    ['@config-plugins/react-native-ble-plx', {
      isBackgroundEnabled: true,
      modes: ['peripheral', 'central'],
      bluetoothAlwaysPermission: 'Allow ZivaOne to find and connect to your ZivaRing.',
    }],
    '@react-native-google-signin/google-signin',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.0',
        },
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
