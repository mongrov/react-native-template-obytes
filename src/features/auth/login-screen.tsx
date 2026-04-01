import type { LoginFormProps } from './components/login-form';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { showMessage } from 'react-native-flash-message';
import { FocusAwareStatusBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { LoginForm } from './components/login-form';

export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    try {
      await signIn({ email: data.email, password: data.password });
      router.push('/');
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Something went wrong';
      showMessage({ message, type: 'danger' });
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} />
    </>
  );
}
