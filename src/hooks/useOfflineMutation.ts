import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addPendingAction } from '../lib/offlineManager';
import { useOffline } from '../context/OfflineContext';

export type MutationType = 'create' | 'update' | 'delete';

export interface OfflineMutationOptions<T> {
  table: string;
  type: MutationType;
  onOptimisticUpdate?: (data: T) => void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onQueued?: () => void;
}

export interface OfflineMutationResult<T> {
  mutate: (data: T & { id?: string }) => Promise<{ queued: boolean; data?: T; error?: Error }>;
  isLoading: boolean;
  error: Error | null;
}

export function useOfflineMutation<T extends Record<string, unknown>>(
  options: OfflineMutationOptions<T>
): OfflineMutationResult<T> {
  const { isOnline, refreshPendingActions } = useOffline();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data: T & { id?: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (isOnline) {
          let result;

          switch (options.type) {
            case 'create': {
              const { data: created, error: createError } = await supabase
                .from(options.table)
                .insert(data)
                .select()
                .single();

              if (createError) throw new Error(createError.message);
              result = created as T;
              break;
            }
            case 'update': {
              if (!data.id) throw new Error('Update requires an id');
              const { data: updated, error: updateError } = await supabase
                .from(options.table)
                .update(data)
                .eq('id', data.id)
                .select()
                .single();

              if (updateError) throw new Error(updateError.message);
              result = updated as T;
              break;
            }
            case 'delete': {
              if (!data.id) throw new Error('Delete requires an id');
              const { error: deleteError } = await supabase
                .from(options.table)
                .delete()
                .eq('id', data.id);

              if (deleteError) throw new Error(deleteError.message);
              result = data as T;
              break;
            }
          }

          options.onSuccess?.(result!);
          setIsLoading(false);
          return { queued: false, data: result };
        } else {
          options.onOptimisticUpdate?.(data as T);

          await addPendingAction({
            type: options.type,
            table: options.table,
            data: data as Record<string, unknown>,
          });

          await refreshPendingActions();
          options.onQueued?.();
          setIsLoading(false);
          return { queued: true, data: data as T };
        }
      } catch (err) {
        const mutationError = err instanceof Error ? err : new Error('Mutation failed');
        setError(mutationError);
        options.onError?.(mutationError);
        setIsLoading(false);

        if (!isOnline) {
          try {
            await addPendingAction({
              type: options.type,
              table: options.table,
              data: data as Record<string, unknown>,
            });
            await refreshPendingActions();
            options.onQueued?.();
            return { queued: true, data: data as T };
          } catch {
            return { queued: false, error: mutationError };
          }
        }

        return { queued: false, error: mutationError };
      }
    },
    [isOnline, options, refreshPendingActions]
  );

  return { mutate, isLoading, error };
}
