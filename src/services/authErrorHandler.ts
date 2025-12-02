/**
 * Auth Error Handler Service
 * 
 * This service intercepts and handles Supabase authentication errors,
 * specifically 403 (RLS violations) and 401 (Unauthorized) errors.
 */

export interface AuthErrorResult {
  isAuthError: boolean;
  errorType: 'rls_violation' | 'jwt_expired' | 'jwt_invalid' | 'unauthorized' | 'unknown' | null;
  message: string;
  shouldRefresh: boolean;
  originalError: unknown;
}

/**
 * Error patterns that indicate authentication/session issues
 */
const AUTH_ERROR_PATTERNS = {
  rls_violation: [
    'new row violates row-level security policy',
    'violates row-level security',
    'RLS policy'
  ],
  jwt_expired: [
    'JWT expired',
    'token has expired',
    'Token expired'
  ],
  jwt_invalid: [
    'Invalid JWT',
    'invalid token',
    'JWT verification failed',
    'Invalid refresh token'
  ],
  unauthorized: [
    'Unauthorized',
    'not authenticated',
    'Authentication required'
  ]
} as const;

/**
 * User-friendly error messages in French
 */
const ERROR_MESSAGES: Record<string, string> = {
  rls_violation: 'Votre session semble désynchronisée. Veuillez actualiser la page ou vous reconnecter.',
  jwt_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
  jwt_invalid: 'Votre session n\'est plus valide. Veuillez vous reconnecter.',
  unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  unknown: 'Une erreur d\'authentification s\'est produite.'
};

/**
 * Determines the type of authentication error based on error message patterns
 */
function detectErrorType(errorMessage: string): AuthErrorResult['errorType'] {
  const lowerMessage = errorMessage.toLowerCase();

  for (const [errorType, patterns] of Object.entries(AUTH_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return errorType as AuthErrorResult['errorType'];
      }
    }
  }

  return null;
}

/**
 * Extracts error message from various error formats
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // Supabase error format
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }

    // PostgrestError format
    if ('error' in error && typeof (error as { error: unknown }).error === 'object') {
      const innerError = (error as { error: { message?: string } }).error;
      if (innerError && 'message' in innerError && typeof innerError.message === 'string') {
        return innerError.message;
      }
    }

    // Details field (common in RLS errors)
    if ('details' in error && typeof (error as { details: unknown }).details === 'string') {
      return (error as { details: string }).details;
    }

    // Code field
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      return (error as { code: string }).code;
    }
  }

  return String(error);
}

/**
 * Checks if an HTTP status code indicates an auth error
 */
function isAuthStatusCode(status?: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Main function to handle Supabase errors
 * 
 * @param error - The error to analyze
 * @param httpStatus - Optional HTTP status code
 * @returns AuthErrorResult with information about the error
 */
export function handleSupabaseError(error: unknown, httpStatus?: number): AuthErrorResult {
  const errorMessage = extractErrorMessage(error);
  const errorType = detectErrorType(errorMessage);
  
  // Check if it's an auth error based on status code or error patterns
  const isAuthError = isAuthStatusCode(httpStatus) || errorType !== null;
  
  // Determine if we should attempt a session refresh
  // RLS violations and expired tokens should trigger a refresh attempt
  const shouldRefresh = errorType === 'rls_violation' || errorType === 'jwt_expired';

  return {
    isAuthError,
    errorType,
    message: errorType ? ERROR_MESSAGES[errorType] : ERROR_MESSAGES.unknown,
    shouldRefresh,
    originalError: error
  };
}

/**
 * Quick check if an error is authentication-related
 */
export function isAuthenticationError(error: unknown, httpStatus?: number): boolean {
  const result = handleSupabaseError(error, httpStatus);
  return result.isAuthError;
}

/**
 * Quick check if the error should trigger a session refresh
 */
export function shouldAttemptSessionRefresh(error: unknown, httpStatus?: number): boolean {
  const result = handleSupabaseError(error, httpStatus);
  return result.shouldRefresh;
}

/**
 * Get a user-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
  const result = handleSupabaseError(error);
  return result.message;
}
