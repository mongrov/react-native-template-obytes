import type { AuthMethodConfig, SocialProvider } from '@mongrov/auth';

import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import {
  AuthDivider,
  Button,
  Input,
  SocialLoginButton,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useColorScheme, useTheme } from '@/lib/theme';

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

export function SignUpForm({
  authConfig = { method: 'email-password' },
  onSubmit = () => {},
  onSocialSignUp,
  onLoginPress,
  loading = false,
  title = 'Create Account',
  subtitle,
}: SignUpFormProps) {
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const gradientColors = React.useMemo(() => {
    if (isDark)
      return ['#1C303E', '#0F1A23', '#000000'] as const;
    return ['#A1D1F8', '#FFFFFF', '#FFFFFF'] as const;
  }, [isDark]);
  const gradientLocations = React.useMemo(
    () => (isDark ? ([0, 0.5, 1] as const) : ([0, 0.7, 0.7] as const)),
    [isDark],
  );

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
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LinearGradient
          colors={[...gradientColors]}
          locations={[...gradientLocations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 0) }]}>
          <View style={styles.topBarRow}>
            <TouchableOpacity
              testID="back-button"
              activeOpacity={0.7}
              onPress={() => (onLoginPress ? onLoginPress() : router.back())}
            >
              <View style={styles.backButton}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke={theme.colors.textPrimary}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </TouchableOpacity>

            {/* <Text style={styles.topBarTitle}>Sign Up</Text> */}
            <View style={{ width: 44 }} />
          </View>
        </View>

        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text testID="form-title" style={styles.title}>
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Social Sign Up Buttons */}
        {hasSocial
          && socialProviders.length > 0
          && (authConfig.method === 'social'
            || (authConfig.method === 'composite'
              && authConfig.primary.method === 'social')) && (
          <View style={styles.socialBlock}>
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
                  style={{
                    marginTop: 8,
                    backgroundColor: theme.colors.primary500,
                    borderRadius: theme.borderRadius.md,
                  }}
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
            <View style={styles.socialBlockAlt}>
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
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              testID="login-link"
              activeOpacity={0.7}
              onPress={onLoginPress}
            >
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
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
    },
    topBar: {
      paddingHorizontal: 20,
    },
    topBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 44,
    },
    topBarTitle: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.gray100,
      justifyContent: 'center',
      alignItems: 'center',
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
    subtitle: {
      marginTop: 10,
      maxWidth: 320,
      fontFamily: theme.fonts.body,
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    socialBlock: {
      marginBottom: 16,
      gap: 12,
    },
    socialBlockAlt: {
      marginTop: 16,
      gap: 12,
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
