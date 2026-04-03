import type { SocialProvider } from '@mongrov/auth';
import type { LoginFormProps } from './components/login-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { ActivityIndicator, FocusAwareStatusBar, View } from '@/components/ui';
import { useAuth, useTenant } from '@/lib/auth';

import { LoginForm } from './components/login-form';

export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { tenant, isReady } = useTenant();
  const [loading, setLoading] = React.useState(false);

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    setLoading(true);
    try {
      await signIn({ email: data.email, password: data.password });
      router.push('/');
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Something went wrong';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onSocialLogin = async (provider: SocialProvider) => {
    setLoading(true);
    try {
      // TODO: Implement social login with useOAuthFlow hook
      // For now, show a message that it's not implemented
      showMessage({
        message: `${provider} login is not yet implemented`,
        type: 'warning',
      });
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Social login failed';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onSSOLogin = async () => {
    setLoading(true);
    try {
      // TODO: Implement SSO login with useOAuthFlow hook
      // For now, show a message that it's not implemented
      showMessage({
        message: 'SSO login is not yet implemented',
        type: 'warning',
      });
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'SSO login failed';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onSignUpPress = () => {
    router.push('/sign-up');
  };

  const onForgotPasswordPress = () => {
    router.push('/forgot-password');
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
      <LoginForm
        authConfig={tenant?.auth ?? { method: 'email-password' }}
        onSubmit={onSubmit}
        onSocialLogin={onSocialLogin}
        onSSOLogin={onSSOLogin}
        onSignUpPress={onSignUpPress}
        onForgotPasswordPress={onForgotPasswordPress}
        loading={loading}
        title={tenant?.name ? `Sign in to ${tenant.name}` : 'Sign In'}
        subtitle="Welcome! Sign in to continue."
      />
    </>
  );
}
