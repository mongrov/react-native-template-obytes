import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Button, Input, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';

const schema = z.object({
  email: z
    .string({
      message: 'Email is required',
    })
    .min(1, 'Email is required')
    .email('Invalid email format'),
});

export type ForgotPasswordFormType = z.infer<typeof schema>;

export type ForgotPasswordFormProps = {
  /** Called when form is submitted */
  onSubmit?: (data: ForgotPasswordFormType) => void;
  /** Called when "Back to login" is pressed */
  onBackToLogin?: () => void;
  /** Whether request is in progress */
  loading?: boolean;
  /** Whether email was sent successfully */
  emailSent?: boolean;
  /** Custom title. Default: "Reset Password" */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
};

// eslint-disable-next-line max-lines-per-function
export function ForgotPasswordForm({
  onSubmit = () => {},
  onBackToLogin,
  loading = false,
  emailSent = false,
  title = 'Reset Password',
  subtitle = 'Enter your email address and we\'ll send you a link to reset your password.',
}: ForgotPasswordFormProps) {
  const form = useForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  if (emailSent) {
    return (
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text className="pb-4 text-center text-6xl">📧</Text>
          <Text
            testID="success-title"
            className="pb-4 text-center text-2xl font-bold"
          >
            Check Your Email
          </Text>
          <Text className="mb-6 max-w-xs text-center text-gray-500">
            We've sent a password reset link to your email address. Please check
            your inbox and follow the instructions.
          </Text>
          {onBackToLogin && (
            <Button
              testID="back-to-login-button"
              variant="secondary"
              label="Back to Login"
              onPress={onBackToLogin}
            />
          )}
        </View>
      </View>
    );
  }

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

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            {subtitle}
          </Text>
        </View>

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

        <form.Subscribe
          selector={state => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <Button
              testID="reset-button"
              label="Send Reset Link"
              onPress={form.handleSubmit}
              loading={isSubmitting || loading}
            />
          )}
        />

        {onBackToLogin && (
          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-gray-500">Remember your password?</Text>
            <Button
              testID="login-link"
              variant="link"
              label="Sign In"
              onPress={onBackToLogin}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
