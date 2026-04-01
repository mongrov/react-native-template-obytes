import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';

// Lazy-load Sentry to avoid crashes in Expo Go
let Sentry: typeof import('@sentry/react-native') | null = null;
try {
  Sentry = require('@sentry/react-native');
}
catch {
  // Native module not available
}

function ErrorFallback({ error }: { error: unknown }) {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-lg font-bold text-red-600">
        Something went wrong
      </Text>
      <Text className="mt-2 text-center text-neutral-600">
        {error instanceof Error ? error.message : String(error)}
      </Text>
    </View>
  );
}

export function SentryErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        Sentry?.captureException(error, {
          extra: { componentStack: info.componentStack },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
