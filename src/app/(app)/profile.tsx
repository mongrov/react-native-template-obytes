/**
 * User Profile Screen
 *
 * Displays user information and account settings.
 */

import * as React from 'react';
import { ScrollView } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Text,
  View,
} from '@/components/ui';
import { useAuth, useSession } from '@/lib/auth';
import { useColorScheme } from '@/lib/theme';

export default function ProfileScreen() {
  const session = useSession();
  const { signOut } = useAuth();
  const { isDark } = useColorScheme();

  const user = session?.user;

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-neutral-500">Not signed in</Text>
      </View>
    );
  }

  // Get initials for avatar
  const initials = getInitials(user.name || user.email || '?');

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1 bg-white dark:bg-neutral-900"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View className="items-center bg-primary-500 pb-8 pt-16 dark:bg-primary-700">
          {/* Avatar */}
          <View className="h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
            {user.avatarUrl ? (
              <Text className="text-4xl">👤</Text>
            ) : (
              <Text className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                {initials}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text className="mt-4 text-xl font-bold text-white">
            {user.name || 'User'}
          </Text>

          {/* Email */}
          {user.email && (
            <Text className="mt-1 text-primary-100">{user.email}</Text>
          )}
        </View>

        {/* Profile Info Section */}
        <View className="mt-6 px-4">
          <Text className="mb-2 text-sm font-medium uppercase text-neutral-500">
            Account Information
          </Text>
          <View className="rounded-lg bg-neutral-50 dark:bg-neutral-800">
            <InfoRow label="User ID" value={user.id} />
            {user.email && <InfoRow label="Email" value={user.email} />}
            {user.name && <InfoRow label="Name" value={user.name} />}
          </View>
        </View>

        {/* Permissions Section */}
        {session?.permissions && session.permissions.length > 0 && (
          <View className="mt-6 px-4">
            <Text className="mb-2 text-sm font-medium uppercase text-neutral-500">
              Permissions
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {session.permissions.map((permission) => (
                <View
                  key={permission}
                  className="rounded-full bg-primary-100 px-3 py-1 dark:bg-primary-900"
                >
                  <Text className="text-xs text-primary-700 dark:text-primary-300">
                    {permission}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="mt-8 px-4">
          <Button
            label="Edit Profile"
            variant="outline"
            onPress={() => {
              // TODO: Navigate to edit profile
            }}
            className="mb-3"
          />
          <Button
            label="Change Password"
            variant="outline"
            onPress={() => {
              // TODO: Navigate to change password
            }}
            className="mb-3"
          />
          <Button
            label="Sign Out"
            variant="destructive"
            onPress={signOut}
          />
        </View>
      </ScrollView>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ label, value, isLast = false }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${
        !isLast ? 'border-b border-neutral-200 dark:border-neutral-700' : ''
      }`}
    >
      <Text className="text-neutral-500">{label}</Text>
      <Text
        className="flex-1 text-right text-neutral-900 dark:text-neutral-100"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
