import { useCallback } from 'react';
import * as Sentry from '@sentry/react';

export const useSentryTransaction = () => {
  const measureAsync = useCallback(async <T>(
    name: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return Sentry.startSpan(
      { name, op: operation },
      async () => {
        try {
          return await fn();
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }, []);

  return { measureAsync };
};
