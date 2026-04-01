import Env from 'env';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useUniwind } from 'uniwind';

import {
  colors,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { Github, Rate, Share, Support, Website } from '@/components/ui/icons';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useSession } from '@/lib/auth/use-session';
import { translate } from '@/lib/i18n';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

export function SettingsScreen() {
  const signOut = useAuth.use.signOut();
  const { theme } = useUniwind();
  const iconColor
    = theme === 'dark' ? colors.neutral[400] : colors.neutral[500];
  const router = useRouter();
  const { hasPermission } = useSession();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleVersionTap = () => {
    // Allow immediate access in dev mode or if user has dev-tools permission
    if (__DEV__ || hasPermission('dev-tools')) {
      router.push('/(app)/dev-tools');
      return;
    }
    // In production without permission: require 5 taps
    tapCountRef.current += 1;
    if (tapTimerRef.current)
      clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      router.push('/(app)/dev-tools');
    }
    else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  };
  return (
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>
          <SettingsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem
              text="settings.app_name"
              value={Env.EXPO_PUBLIC_NAME}
            />
            <SettingsItem
              text="settings.version"
              value={Env.EXPO_PUBLIC_VERSION}
              onPress={handleVersionTap}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.support_us">
            <SettingsItem
              text="settings.share"
              icon={<Share color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.rate"
              icon={<Rate color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.support"
              icon={<Support color={iconColor} />}
              onPress={() => {}}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.links">
            <SettingsItem text="settings.privacy" onPress={() => {}} />
            <SettingsItem text="settings.terms" onPress={() => {}} />
            <SettingsItem
              text="settings.github"
              icon={<Github color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.website"
              icon={<Website color={iconColor} />}
              onPress={() => {}}
            />
          </SettingsContainer>

          <View className="my-8">
            <SettingsContainer>
              <SettingsItem text="settings.logout" onPress={signOut} />
            </SettingsContainer>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
