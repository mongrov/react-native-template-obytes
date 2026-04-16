import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text, TouchableOpacity, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useColorScheme, useTheme } from '@/lib/theme';

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

export function ForgotPasswordForm({
  onSubmit = () => {},
  onBackToLogin,
  loading = false,
  emailSent = false,
  title = 'Reset Password',
  subtitle = 'Enter your email address and we\'ll send you a link to reset your password.',
}: ForgotPasswordFormProps) {
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const insets = useSafeAreaInsets();
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

  const gradientColors = React.useMemo(() => {
    if (isDark)
      return ['#1C303E', '#0F1A23', '#000000'] as const;
    return ['#A1D1F8', '#FFFFFF', '#FFFFFF'] as const;
  }, [isDark]);
  const gradientLocations = React.useMemo(
    () => (isDark ? ([0, 0.5, 1] as const) : ([0, 0.7, 0.7] as const)),
    [isDark],
  );
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (emailSent) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LinearGradient
          colors={[...gradientColors]}
          locations={[...gradientLocations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(insets.top, 0) + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerWrap}>
            <View style={styles.header}>
              <Text style={styles.emoji}>📧</Text>
              <Text testID="success-title" style={styles.successTitle}>
                Check Your Email
              </Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a password reset link to your email address. Please check
                your inbox and follow the instructions.
              </Text>
            </View>

            {onBackToLogin && (
              <Button
                testID="back-to-login-button"
                label="Back to Login"
                onPress={onBackToLogin}
                style={{
                  marginTop: 8,
                  backgroundColor: theme.colors.primary500,
                  borderRadius: theme.borderRadius.md,
                }}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LinearGradient
          colors={[...gradientColors]}
          locations={[...gradientLocations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(insets.top, 0) + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerWrap}>
            <View style={styles.header}>
              <Text testID="form-title" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
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
                  style={{
                    marginTop: 12,
                    backgroundColor: theme.colors.primary500,
                    borderRadius: theme.borderRadius.md,
                  }}
                />
              )}
            />

            {onBackToLogin && (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <TouchableOpacity
                  testID="login-link"
                  activeOpacity={0.7}
                  onPress={onBackToLogin}
                >
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      flexGrow: 1,
      justifyContent: 'center',
    },
    centerWrap: {
      width: '100%',
      maxWidth: 380,
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      paddingBottom: 18,
    },
    title: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.03,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    successTitle: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.02,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginTop: 8,
    },
    subtitle: {
      marginTop: 10,
      maxWidth: 320,
      fontFamily: theme.fonts.body,
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    emoji: {
      fontSize: 52,
      lineHeight: 60,
      textAlign: 'center',
    },
    footerRow: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    footerText: {
      fontFamily: theme.fonts.body,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    linkText: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 14,
      color: theme.colors.primary500,
    },
  });
}
