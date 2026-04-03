import type { ForgotPasswordFormProps } from './components/forgot-password-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { showMessage } from 'react-native-flash-message';

import { FocusAwareStatusBar } from '@/components/ui';

import { ForgotPasswordForm } from './components/forgot-password-form';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const onSubmit: ForgotPasswordFormProps['onSubmit'] = async (_data) => {
    setLoading(true);
    try {
      // TODO: Implement actual password reset via adapter
      // For now, we'll simulate a successful request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailSent(true);
      showMessage({
        message: 'Password reset link sent!',
        type: 'success',
      });
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Failed to send reset link';
      showMessage({ message, type: 'danger' });
    }
    finally {
      setLoading(false);
    }
  };

  const onBackToLogin = () => {
    router.push('/login');
  };

  return (
    <>
      <FocusAwareStatusBar />
      <ForgotPasswordForm
        onSubmit={onSubmit}
        onBackToLogin={onBackToLogin}
        loading={loading}
        emailSent={emailSent}
      />
    </>
  );
}
