/**
 * Lightweight error-catch handler for timon operations.
 * Logs structured error objects; Sentry integration is stubbed for now.
 */

export function handleCatch(error: any, name: string, shouldLogToSentry = true, data?: any) {
  const errorObj = {
    name,
    error,
    data: JSON.stringify(data || ''),
  };

  console.error({ errorObj });
  // TODO: wire up Sentry / @mongrov/core logging when available
  // if (shouldLogToSentry) captureException(error);
  void shouldLogToSentry;
}
