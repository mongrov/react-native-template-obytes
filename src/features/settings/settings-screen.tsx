import Env from 'env';
import { useRouter } from 'expo-router';
import { useRef } from 'react';

import {
  colors,
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { ArrowRight, Github, Rate, Share, Support, Website } from '@/components/ui/icons';
import { useAuth, useSession } from '@/lib/auth';
import { translate } from '@/lib/i18n';
import { useColorScheme } from '@/lib/theme';
import { BiometricItem } from './components/biometric-item';
import { LanguageItem } from './components/language-item';
import { NotificationItem } from './components/notification-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDark } = useColorScheme();
  const iconColor = isDark ? colors.neutral[400] : colors.neutral[500];
  const router = useRouter();
  const session = useSession();
  const hasPermission = session?.hasPermission ?? (() => false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleVersionTap = () => {
    if (__DEV__ || hasPermission('dev-tools')) {
      router.push('/(app)/dev-tools');
      return;
    }
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
      <ScrollView className="bg-white dark:bg-neutral-950">
        <View className="flex-1 px-4 pt-16 pb-8">
          <Text variant="h3" className="mb-2">
            {translate('settings.title')}
          </Text>

          {/* Profile Card */}
          <ProfileCard />

          <SettingsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem isLast />
          </SettingsContainer>

          <SettingsContainer title="settings.security">
            <BiometricItem />
            <NotificationItem isLast />
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
              isLast
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
              isLast
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
              isLast
            />
          </SettingsContainer>

          <SettingsContainer>
            <SettingsItem
              text="settings.logout"
              onPress={signOut}
              destructive
              isLast
            />
          </SettingsContainer>
        </View>
      </ScrollView>
    </>
  );
}

function ProfileCard() {
  const router = useRouter();
  const session = useSession();
  const { isDark } = useColorScheme();

  const user = session?.user;
  if (!user) return null;

  const initials = getInitials(user.name || user.email || '?');

  return (
    <Pressable
      onPress={() => router.push('/(app)/profile')}
      className="mb-4 flex-row items-center rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800"
    >
      {/* Avatar */}
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-500">
        <Text className="text-xl font-bold text-white">{initials}</Text>
      </View>

      {/* Info */}
      <View className="ml-4 flex-1">
        <Text className="font-semibold text-neutral-900 dark:text-neutral-100">
          {user.name || 'User'}
        </Text>
        {user.email && (
          <Text className="text-sm text-neutral-500">{user.email}</Text>
        )}
      </View>

      {/* Arrow */}
      <ArrowRight
        color={isDark ? colors.neutral[500] : colors.neutral[400]}
      />
    </Pressable>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
