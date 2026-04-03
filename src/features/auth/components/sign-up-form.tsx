import type { AuthMethodConfig, SocialProvider } from '@mongrov/auth';

import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import {
  AuthDivider,
  Button,
  Input,
  SocialLoginButton,
  Text,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';

const schema = z
  .object({
    name: z
      .string({
        message: 'Name is required',
      })
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string({
        message: 'Email is required',
      })
      .min(1, 'Email is required')
      .email('Invalid email format'),
    password: z
      .string({
        message: 'Password is required',
      })
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string({
        message: 'Please confirm your password',
      })
      .min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormType = z.infer<typeof schema>;

export type SignUpFormProps = {
  /** Auth method configuration. Default: email-password */
  authConfig?: AuthMethodConfig;
  /** Called when form is submitted */
  onSubmit?: (data: SignUpFormType) => void;
  /** Called when a social provider button is pressed */
  onSocialSignUp?: (provider: SocialProvider) => void;
  /** Called when "Already have an account?" is pressed */
  onLoginPress?: () => void;
  /** Whether registration is in progress */
  loading?: boolean;
  /** Custom title. Default: "Create Account" */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
};

// eslint-disable-next-line max-lines-per-function
export function SignUpForm({
  authConfig = { method: 'email-password' },
  onSubmit = () => {},
  onSocialSignUp,
  onLoginPress,
  loading = false,
  title = 'Create Account',
  subtitle,
}: SignUpFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const hasEmailPassword
    = authConfig.method === 'email-password'
      || (authConfig.method === 'composite'
        && (authConfig.primary.method === 'email-password'
          || authConfig.alternatives.some(a => a.method === 'email-password')));

  const hasSocial
    = authConfig.method === 'social'
      || (authConfig.method === 'composite'
        && (authConfig.primary.method === 'social'
          || authConfig.alternatives.some(a => a.method === 'social')));

  const socialProviders = React.useMemo((): SocialProvider[] => {
    if (authConfig.method === 'social') {
      return authConfig.providers;
    }
    if (authConfig.method === 'composite') {
      const socialConfig
        = authConfig.primary.method === 'social'
          ? authConfig.primary
          : authConfig.alternatives.find(a => a.method === 'social');
      if (socialConfig && socialConfig.method === 'social') {
        return socialConfig.providers;
      }
    }
    return [];
  }, [authConfig]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            {title}
          </Text>

          {subtitle && (
            <Text className="mb-6 max-w-xs text-center text-gray-500">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Social Sign Up Buttons */}
        {hasSocial
          && socialProviders.length > 0
          && (authConfig.method === 'social'
            || (authConfig.method === 'composite'
              && authConfig.primary.method === 'social')) && (
          <View className="mb-4 gap-3">
            {socialProviders.map(provider => (
              <SocialLoginButton
                key={provider}
                testID={`social-${provider}-button`}
                provider={provider}
                onPress={() => onSocialSignUp?.(provider)}
                loading={loading}
                label={`Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
              />
            ))}
          </View>
        )}

        {/* Divider */}
        {hasSocial
          && (authConfig.method === 'social'
            || (authConfig.method === 'composite'
              && authConfig.primary.method === 'social'))
            && hasEmailPassword && <AuthDivider text="or sign up with email" />}

        {/* Email/Password Form */}
        {hasEmailPassword && (
          <>
            <form.Field
              name="name"
              children={field => (
                <Input
                  testID="name-input"
                  label="Full Name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                  autoCapitalize="words"
                />
              )}
            />

            <form.Field
              name="email"
              children={field => (
                <Input
                  testID="email-input"
                  label="Email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />

            <form.Field
              name="password"
              children={field => (
                <Input
                  testID="password-input"
                  label="Password"
                  placeholder="At least 8 characters"
                  secureTextEntry={true}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                />
              )}
            />

            <form.Field
              name="confirmPassword"
              children={field => (
                <Input
                  testID="confirm-password-input"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  secureTextEntry={true}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                />
              )}
            />

            <form.Subscribe
              selector={state => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Button
                  testID="signup-button"
                  label="Create Account"
                  onPress={form.handleSubmit}
                  loading={isSubmitting || loading}
                />
              )}
            />
          </>
        )}

        {/* Alternative social buttons (in composite mode after email-password) */}
        {authConfig.method === 'composite'
          && authConfig.primary.method === 'email-password'
          && hasSocial
          && socialProviders.length > 0 && (
          <>
            <AuthDivider />
            <View className="mt-4 gap-3">
              {socialProviders.map(provider => (
                <SocialLoginButton
                  key={provider}
                  testID={`social-${provider}-button`}
                  provider={provider}
                  onPress={() => onSocialSignUp?.(provider)}
                  loading={loading}
                  label={`Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                />
              ))}
            </View>
          </>
        )}

        {/* Login link */}
        {onLoginPress && (
          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-gray-500">Already have an account?</Text>
            <Button
              testID="login-link"
              variant="link"
              label="Sign In"
              onPress={onLoginPress}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
