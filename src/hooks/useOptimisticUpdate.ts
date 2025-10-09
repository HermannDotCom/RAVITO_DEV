import { useState, useCallback } from 'react';

type OptimisticAction<T, P> = (
  currentState: T,
  params: P
) => T;

type AsyncAction<P, R> = (params: P) => Promise<R>;

interface UseOptimisticUpdateOptions<T, P, R> {
  currentState: T;
  optimisticUpdate: OptimisticAction<T, P>;
  asyncAction: AsyncAction<P, R>;
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
}

export const useOptimisticUpdate = <T, P, R>({
  currentState,
  optimisticUpdate,
  asyncAction,
  onSuccess,
  onError,
  rollbackOnError = true,
}: UseOptimisticUpdateOptions<T, P, R>) => {
  const [state, setState] = useState<T>(currentState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (params: P) => {
      const previousState = state;

      try {
        setIsLoading(true);
        setError(null);

        const optimisticState = optimisticUpdate(state, params);
        setState(optimisticState);

        const result = await asyncAction(params);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (rollbackOnError) {
          setState(previousState);
        }

        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [state, optimisticUpdate, asyncAction, onSuccess, onError, rollbackOnError]
  );

  return {
    state,
    execute,
    isLoading,
    error,
  };
};
