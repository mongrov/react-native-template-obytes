/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { TextInputProps } from 'react-native';
import { Text } from '@mongrov/ui';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';

import { tv } from 'tailwind-variants';
import { useTheme } from '@/lib/theme';
import colors from './colors';

const inputTv = tv({
  slots: {
    container: 'mb-4',
    label: 'text-grey-100 mb-1 text-base dark:text-neutral-100',
    input:
      'font-inter mt-0 rounded-xl border-[0.5px] border-neutral-300 bg-neutral-100 px-4 py-3 text-base/5 font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-white',
  },

  variants: {
    focused: {
      true: {
        input: 'border-neutral-400 dark:border-neutral-300',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
  },
});

export type NInputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
} & TextInputProps;

export function Input({ ref, ...props }: NInputProps & { ref?: React.Ref<NTextInput | null> }) {
  const theme = useTheme();
  const { label, error, testID, onBlur: onBlurProp, onFocus: onFocusProp, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);

  const onBlur = React.useCallback(
    (e: any) => {
      setIsFocussed(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (e: any) => {
      setIsFocussed(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const styles = inputTv({
    error: Boolean(error),
    focused: isFocussed,
    disabled: Boolean(props.disabled),
  });

  return (
    <View className={styles.container()}>
      {label && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label()}
          style={StyleSheet.flatten([
            {
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: 16,
              lineHeight: 20,
              color: theme.colors.textPrimary,
            },
          ])}
        >
          {label}
        </Text>
      )}
      <NTextInput
        testID={testID}
        ref={ref}
        placeholderTextColor={colors.neutral[400]}
        className={styles.input()}
        onBlur={onBlur}
        onFocus={onFocus}
        {...inputProps}
        style={StyleSheet.flatten([
          { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
          { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          {
            fontFamily: theme.fonts.bodyMedium,
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.bgSecondary,
            borderColor: error
              ? theme.colors.critical
              : isFocussed
                ? theme.colors.borderStrong
                : theme.colors.borderDefault,
          },
          inputProps.style,
        ])}
      />
      {error && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          className="text-sm text-danger-400 dark:text-danger-600"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
