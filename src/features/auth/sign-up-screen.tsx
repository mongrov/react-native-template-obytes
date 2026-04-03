import type { SocialProvider } from '@mongrov/auth';
import type { SignUpFormProps } from './components/sign-up-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { ActivityIndicator, FocusAwareStatusBar, View } from '@/components/ui';
import { useAuth, useTenant } from '@/lib/auth';

import { SignUpForm } from './components/sign-up-form';

export function SignUpScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { tenant, isReady } = useTenant();
  const [loading, setLoading] = React.useState(false);

  const onSubmit: SignUpFormProps['onSubmit'] = async (data) => {
    setLoading(true);
    try {
      // TODO: Implement actual registration via adapter
      // For now, we'll sign in directly after "registration"
      await signIn({ email: data.email, password: data.password });
      showMessage({
        message: 'Account created successfully!',
        type: 'success',
      });
      router.push('/');
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Registration failed';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onSocialSignUp = async (provider: SocialProvider) => {
    setLoading(true);
    try {
      // TODO: Implement social signup with useOAuthFlow hook
      showMessage({
        message: `${provider} sign up is not yet implemented`,
        type: 'warning',
      });
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Social sign up failed';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onLoginPress = () => {
    router.push('/login');
  };

  // Show loading while tenant context initializes
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <FocusAwareStatusBar />
      <SignUpForm
        authConfig={tenant?.auth ?? { method: 'email-password' }}
        onSubmit={onSubmit}
        onSocialSignUp={onSocialSignUp}
        onLoginPress={onLoginPress}
        loading={loading}
        title={tenant?.name ? `Join ${tenant.name}` : 'Create Account'}
        subtitle="Create an account to get started."
      />
    </>
  );
}
