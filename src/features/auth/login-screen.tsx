import type { SocialProvider } from '@mongrov/auth';
import { useSocialAuth } from '@mongrov/auth';
import type { LoginFormProps } from './components/login-form';

import Env from 'env';
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

  // Social auth hooks - configure with your OAuth client IDs from env
  const socialAuth = useSocialAuth({
    google: {
      webClientId: Env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: Env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    },
  });

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
      // Use the native social auth hooks
      const result = await socialAuth.signInWith(provider);

      if (result) {
        // Got credentials from native OAuth - pass to your auth adapter
        // The adapter should validate the token with your backend
        if (result.provider === 'apple') {
          await signIn({
            provider: 'apple',
            token: result.identityToken,
            authorizationCode: result.authorizationCode,
          });
        } else if (result.provider === 'google') {
          await signIn({
            provider: 'google',
            token: result.idToken,
            accessToken: result.accessToken,
          });
        }
        router.push('/');
      }
      // If result is null, user cancelled - no error to show
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
