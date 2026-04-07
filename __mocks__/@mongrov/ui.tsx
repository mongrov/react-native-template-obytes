/**
 * Mock for @mongrov/ui
 */
import React from 'react';
import { Text as RNText, View, Pressable, ActivityIndicator } from 'react-native';

export const Text = RNText;

// Button mock that properly handles props
export const Button = ({
  children,
  label,
  disabled,
  loading,
  onPress,
  testID,
  ...props
}: {
  children?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  testID?: string;
  [key: string]: any;
}) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      disabled={isDisabled}
      onPress={onPress}
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : children ? (
        children
      ) : label ? (
        <RNText>{label}</RNText>
      ) : null}
    </Pressable>
  );
};

export const Card = View;
export const CardHeader = View;
export const CardTitle = RNText;
export const CardDescription = RNText;
export const CardContent = View;
export const CardFooter = View;
export const Separator = View;
export const Skeleton = View;

// State components
export const EmptyState = View;
export const ErrorState = View;
export const LoadingState = View;

// Auth components
export const AuthDivider = View;
export const SSOButton = View;
export const SocialLoginButton = View;

// Tenant picker
export const TenantPicker = View;
export const TenantSelector = View;

// Renderers
export const MessageRenderer = ({ children }: { children: (props: any) => any }) =>
  children({
    message: {},
    isOwnMessage: false,
    isReply: false,
    isStreaming: false,
    content: { type: 'text', text: '', hasText: true, hasMedia: false },
    deliveryStatus: { status: 'sent', label: 'Sent', icon: 'sent' },
    timestamp: 'now',
    attachments: { count: 0, byType: { images: [], videos: [], files: [] } },
    reactions: { sorted: [], totalCount: 0, hasUserReacted: () => false },
  });

export const AttachmentRenderer = ({ children }: { children: (props: any) => any }) =>
  children({
    attachment: {},
    isImage: false,
    isVideo: false,
    isAudio: false,
    isFile: false,
    fileSize: '0 B',
    duration: '0:00',
    extension: '',
    mimeCategory: 'unknown',
    isLoading: false,
    progress: 0,
    iconName: 'file',
  });

export const ReactionPicker = ({ children }: { children: (props: any) => any }) =>
  children({
    quickReactions: [],
    currentReactions: [],
    toggleReaction: () => {},
    isFullPickerOpen: false,
    openFullPicker: () => {},
    closeFullPicker: () => {},
    totalReactionCount: 0,
    uniqueEmojiCount: 0,
  });

export const useMessageRenderer = () => ({
  isOwnMessage: false,
  isReply: false,
  isStreaming: false,
  content: { type: 'text', text: '', hasText: true, hasMedia: false },
  deliveryStatus: { status: 'sent', label: 'Sent', icon: 'sent' },
  timestamp: 'now',
  attachments: { count: 0, byType: { images: [], videos: [], files: [] } },
  reactions: { sorted: [], totalCount: 0, hasUserReacted: () => false },
});

export const useAttachmentRenderer = () => ({
  isImage: false,
  isVideo: false,
  isAudio: false,
  isFile: false,
  fileSize: '0 B',
  duration: '0:00',
  extension: '',
  mimeCategory: 'unknown',
  isLoading: false,
  progress: 0,
  iconName: 'file',
});

export const useReactionPicker = () => ({
  quickReactions: [],
  currentReactions: [],
  toggleReaction: () => {},
  isFullPickerOpen: false,
  openFullPicker: () => {},
  closeFullPicker: () => {},
  totalReactionCount: 0,
  uniqueEmojiCount: 0,
});

// Variants
export const textVariants = () => '';
export const buttonVariants = () => '';
export const buttonTextVariants = () => '';

// Utils
export const cn = (...args: any[]) => args.filter(Boolean).join(' ');

// Context
export const TextClassContext = {
  Provider: ({ children }: { children: any }) => children,
};
