import { supabase } from './supabase';
import { handleSupabaseError, AuthErrorResult } from '../services/authErrorHandler';

export interface SupabaseCallResult<T> {
  data: T | null;
  error: AuthErrorResult | null;
  success: boolean;
  shouldRefresh: boolean;
}

/**
 * Options for the withRetry wrapper
 */
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: AuthErrorResult) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 1,
  retryDelay: 500,
  onRetry: () => {}
};

/**
 * Attempts to refresh the session
 * Returns true if successful
 */
async function refreshSession(): Promise<boolean> {
  try {
    console.log('[supabaseWithRetry] Attempting session refresh');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[supabaseWithRetry] Session refresh failed:', error);
      return false;
    }
    
    if (data.session) {
      console.log('[supabaseWithRetry] Session refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[supabaseWithRetry] Unexpected error during session refresh:', error);
    return false;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps a Supabase call with automatic retry on auth errors
 * 
 * @param operation - A function that returns a Supabase query result
 * @param options - Retry options
 * @returns A result object with data, error, success flag, and shouldRefresh indicator
 * 
 * @example
 * ```ts
 * const result = await executeWithRetry(async () => {
 *   return await supabase
 *     .from('support_tickets')
 *     .insert({ user_id: userId, subject, message })
 *     .select()
 *     .single();
 * });
 * 
 * if (result.success) {
 *   // Use result.data
 * } else if (result.shouldRefresh) {
 *   // Trigger UI to show session error banner
 * }
 * ```
 */
export async function executeWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  options?: RetryOptions
): Promise<SupabaseCallResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: AuthErrorResult | null = null;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const { data, error } = await operation();
      
      if (!error) {
        return {
          data,
          error: null,
          success: true,
          shouldRefresh: false
        };
      }
      
      // Analyze the error
      const authError = handleSupabaseError(error);
      lastError = authError;
      
      // If it's not an auth error, don't retry
      if (!authError.isAuthError) {
        console.log('[supabaseWithRetry] Non-auth error, not retrying:', error);
        return {
          data: null,
          error: authError,
          success: false,
          shouldRefresh: false
        };
      }
      
      // If we shouldn't refresh (e.g., invalid JWT), don't retry but still show UI
      // For invalid JWT/unauthorized, user needs to log out and re-authenticate
      if (!authError.shouldRefresh) {
        console.log('[supabaseWithRetry] Auth error that should not be retried:', authError.errorType);
        return {
          data: null,
          error: authError,
          success: false,
          // Show the banner so user can choose to log out, even if auto-refresh won't help
          shouldRefresh: authError.isAuthError
        };
      }
      
      // If we have retries left, attempt session refresh
      if (attempt < opts.maxRetries) {
        console.log(`[supabaseWithRetry] Auth error detected, attempting recovery (attempt ${attempt + 1}/${opts.maxRetries})`);
        opts.onRetry(attempt + 1, authError);
        
        // Try to refresh the session
        const refreshed = await refreshSession();
        
        if (refreshed) {
          // Wait a bit before retrying
          await sleep(opts.retryDelay);
          continue; // Retry the operation
        }
      }
      
    } catch (error) {
      console.error('[supabaseWithRetry] Unexpected error:', error);
      const authError = handleSupabaseError(error);
      lastError = authError;
    }
  }
  
  // All retries exhausted
  console.log('[supabaseWithRetry] All retries exhausted');
  return {
    data: null,
    error: lastError,
    success: false,
    shouldRefresh: lastError?.shouldRefresh ?? false
  };
}

/**
 * A simpler version that wraps any async operation and returns
 * standardized result with auth error handling
 */
export async function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  extractError?: (result: T) => unknown
): Promise<SupabaseCallResult<T>> {
  try {
    const result = await operation();
    
    // If an error extractor is provided, check for errors
    if (extractError) {
      const error = extractError(result);
      if (error) {
        const authError = handleSupabaseError(error);
        return {
          data: null,
          error: authError,
          success: false,
          shouldRefresh: authError.shouldRefresh
        };
      }
    }
    
    return {
      data: result,
      error: null,
      success: true,
      shouldRefresh: false
    };
  } catch (error) {
    const authError = handleSupabaseError(error);
    return {
      data: null,
      error: authError,
      success: false,
      shouldRefresh: authError.shouldRefresh
    };
  }
}
