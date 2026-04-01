/* eslint-disable react-refresh/only-export-components */
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { useLogger } from '@mongrov/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { client } from './client';
import { setupLoggingInterceptor } from './interceptors/logging';

export const queryClient = new QueryClient();

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);

  const logger = useLogger();

  // Wire up logging interceptor once when provider mounts
  React.useEffect(() => {
    setupLoggingInterceptor(client, logger);
  }, [logger]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
