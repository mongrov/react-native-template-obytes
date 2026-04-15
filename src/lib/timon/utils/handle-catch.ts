/**
 * Lightweight error-catch handler for timon operations.
 * Logs structured error objects; Sentry integration is stubbed for now.
 */
export const handleCatch = (
  error: any,
  name: string,
  _shouldLogToSentry = true,
  data?: any
) => {
  const errorObj = {
    error,
    data: JSON.stringify(data || ''),
  };

  console.log({ errorObj });
  // TODO: wire up Sentry / @mongrov/core logging when available
  // captureException(error);
};
