import type { AuthMethodConfig, SocialProvider } from '@mongrov/auth';

import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuthDivider,
  Button,
  Input,
  SocialLoginButton,
  SSOButton,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useColorScheme, useTheme } from '@/lib/theme';

const schema = z.object({
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
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  /** Auth method configuration. Default: email-password */
  authConfig?: AuthMethodConfig;
  /** Called when email/password form is submitted */
  onSubmit?: (data: FormType) => void;
  /** Called when a social provider button is pressed */
  onSocialLogin?: (provider: SocialProvider) => void;
  /** Called when SSO button is pressed */
  onSSOLogin?: () => void;
  /** Called when "Create account" is pressed */
  onSignUpPress?: () => void;
  /** Called when "Forgot password?" is pressed */
  onForgotPasswordPress?: () => void;
  /** Whether any auth action is in progress */
  loading?: boolean;
  /** SSO provider name for display (e.g., "Okta", "Azure AD") */
  ssoProviderName?: string;
  /** Custom title. Default: "Sign In" */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
};

export function LoginForm({
  authConfig = { method: 'email-password' },
  onSubmit = () => {},
  onSocialLogin,
  onSSOLogin,
  onSignUpPress,
  onForgotPasswordPress,
  loading = false,
  ssoProviderName,
  title = 'Sign In',
  subtitle,
}: LoginFormProps) {
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const insets = useSafeAreaInsets();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
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

  const hasSSO
    = authConfig.method === 'sso'
      || (authConfig.method === 'composite'
        && (authConfig.primary.method === 'sso'
          || authConfig.alternatives.some(a => a.method === 'sso')));

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

  const ssoConfig = React.useMemo(() => {
    if (authConfig.method === 'sso') {
      return authConfig;
    }
    if (authConfig.method === 'composite') {
      const config
        = authConfig.primary.method === 'sso'
          ? authConfig.primary
          : authConfig.alternatives.find(a => a.method === 'sso');
      if (config && config.method === 'sso') {
        return config;
      }
    }
    return null;
  }, [authConfig]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            { paddingTop: Math.max(insets.top, 0) + 24 },
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

        {/* SSO Button (shown first if primary) */}
        {hasSSO
          && authConfig.method !== 'composite'
          && authConfig.method === 'sso' && (
          <View style={styles.blockGap}>
            <SSOButton
              testID="sso-button"
              onPress={onSSOLogin ?? (() => {})}
              loading={loading}
              providerName={ssoProviderName ?? ssoConfig?.provider}
            />
          </View>
        )}

        {/* Social Buttons - shown at top for social-only or social-primary modes */}
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
                onPress={() => onSocialLogin?.(provider)}
                loading={loading}
              />
            ))}
          </View>
        )}

        {/* Divider between social/SSO and email-password */}
        {((hasSocial
          && (authConfig.method === 'social'
            || (authConfig.method === 'composite'
              && authConfig.primary.method === 'social')))
            || (hasSSO && authConfig.method === 'sso'))
          && hasEmailPassword && <AuthDivider text="or sign in with email" />}

        {/* Email/Password Form */}
        {hasEmailPassword && (
          <>
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
                  placeholder="***"
                  secureTextEntry={true}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  error={getFieldError(field)}
                />
              )}
            />

            {onForgotPasswordPress && (
              <View style={styles.forgotRow}>
                <TouchableOpacity
                  testID="forgot-password-link"
                  activeOpacity={0.7}
                  onPress={onForgotPasswordPress}
                >
                  <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            )}

            <form.Subscribe
              selector={state => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Button
                  testID="login-button"
                  label="Login"
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

        {/* Divider between email-password and alternatives */}
        {hasEmailPassword
          && authConfig.method === 'composite'
          && (hasSocial || hasSSO) && <AuthDivider />}

        {/* Alternative social buttons (in composite mode after email-password) */}
        {authConfig.method === 'composite'
          && authConfig.primary.method === 'email-password'
          && hasSocial
          && socialProviders.length > 0 && (
          <View style={styles.socialBlockAlt}>
            {socialProviders.map(provider => (
              <SocialLoginButton
                key={provider}
                testID={`social-${provider}-button`}
                provider={provider}
                onPress={() => onSocialLogin?.(provider)}
                loading={loading}
              />
            ))}
          </View>
        )}

        {/* Alternative SSO button (in composite mode after email-password) */}
        {authConfig.method === 'composite'
          && authConfig.primary.method === 'email-password'
          && hasSSO && (
          <View style={styles.blockGap}>
            <SSOButton
              testID="sso-button"
              onPress={onSSOLogin ?? (() => {})}
              loading={loading}
              providerName={ssoProviderName ?? ssoConfig?.provider}
            />
          </View>
        )}

        {/* Sign up link */}
        {onSignUpPress && (
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <TouchableOpacity
              testID="signup-link"
              activeOpacity={0.7}
              onPress={onSignUpPress}
            >
              <Text style={styles.linkText}>Sign Up</Text>
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
    blockGap: {
      marginBottom: 16,
    },
    socialBlock: {
      marginBottom: 16,
      gap: 12,
    },
    socialBlockAlt: {
      marginTop: 16,
      gap: 12,
    },
    forgotRow: {
      marginBottom: 8,
      alignItems: 'flex-end',
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
