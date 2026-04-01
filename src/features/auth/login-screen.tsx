import type { LoginFormProps } from './components/login-form';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { FocusAwareStatusBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { LoginForm } from './components/login-form';

export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    console.log(data);
    await signIn({ email: data.email, password: data.password });
    router.push('/');
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} />
    </>
  );
}
