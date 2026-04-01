/* eslint-disable react-refresh/only-export-components */
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { useAuthInterceptor } from '@mongrov/auth/interceptor';
import { useLogger } from '@mongrov/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { client } from './client';
import { setupLoggingInterceptor } from './interceptors/logging';

export const queryClient = new QueryClient();

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);

  const logger = useLogger();

  // Wire up auth interceptor; eject on unmount
  useAuthInterceptor(client);

  // Wire up logging interceptor; eject on unmount / logger change
  React.useEffect(() => {
    return setupLoggingInterceptor(client, logger);
  }, [logger]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
