import { describe, it, expect } from 'vitest';
import {
  handleSupabaseError,
  isAuthenticationError,
  shouldAttemptSessionRefresh,
  getAuthErrorMessage,
  AuthErrorResult
} from '../authErrorHandler';

describe('authErrorHandler', () => {
  describe('handleSupabaseError', () => {
    it('should detect RLS violation errors', () => {
      const error = { message: 'new row violates row-level security policy' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('rls_violation');
      expect(result.shouldRefresh).toBe(true);
    });

    it('should detect JWT expired errors', () => {
      const error = { message: 'JWT expired' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('jwt_expired');
      expect(result.shouldRefresh).toBe(true);
    });

    it('should detect invalid JWT errors', () => {
      const error = { message: 'Invalid JWT' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('jwt_invalid');
      expect(result.shouldRefresh).toBe(false); // Invalid JWT should not trigger refresh
    });

    it('should detect unauthorized errors', () => {
      const error = { message: 'Unauthorized' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('unauthorized');
      expect(result.shouldRefresh).toBe(false);
    });

    it('should handle 401 status code as auth error', () => {
      const error = { message: 'Some error' };
      const result = handleSupabaseError(error, 401);
      
      expect(result.isAuthError).toBe(true);
    });

    it('should handle 403 status code as auth error', () => {
      const error = { message: 'Some error' };
      const result = handleSupabaseError(error, 403);
      
      expect(result.isAuthError).toBe(true);
    });

    it('should not identify regular errors as auth errors', () => {
      const error = { message: 'Database connection failed' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(false);
      expect(result.errorType).toBe(null);
      expect(result.shouldRefresh).toBe(false);
    });

    it('should handle string errors', () => {
      const error = 'JWT expired';
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('jwt_expired');
    });

    it('should handle nested error objects', () => {
      const error = {
        error: {
          message: 'new row violates row-level security policy'
        }
      };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('rls_violation');
    });

    it('should preserve original error', () => {
      const originalError = { message: 'JWT expired', code: '401' };
      const result = handleSupabaseError(originalError);
      
      expect(result.originalError).toBe(originalError);
    });

    it('should handle case-insensitive error patterns', () => {
      const error = { message: 'NEW ROW VIOLATES ROW-LEVEL SECURITY POLICY' };
      const result = handleSupabaseError(error);
      
      expect(result.isAuthError).toBe(true);
      expect(result.errorType).toBe('rls_violation');
    });
  });

  describe('isAuthenticationError', () => {
    it('should return true for RLS violation', () => {
      const error = { message: 'violates row-level security' };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = { message: 'Network error' };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should consider HTTP status codes', () => {
      const error = { message: 'Error' };
      expect(isAuthenticationError(error, 401)).toBe(true);
      expect(isAuthenticationError(error, 500)).toBe(false);
    });
  });

  describe('shouldAttemptSessionRefresh', () => {
    it('should return true for RLS violations', () => {
      const error = { message: 'new row violates row-level security policy' };
      expect(shouldAttemptSessionRefresh(error)).toBe(true);
    });

    it('should return true for expired JWT', () => {
      const error = { message: 'token has expired' };
      expect(shouldAttemptSessionRefresh(error)).toBe(true);
    });

    it('should return false for invalid JWT', () => {
      const error = { message: 'Invalid JWT' };
      expect(shouldAttemptSessionRefresh(error)).toBe(false);
    });

    it('should return false for regular errors', () => {
      const error = { message: 'Database error' };
      expect(shouldAttemptSessionRefresh(error)).toBe(false);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return French message for RLS violation', () => {
      const error = { message: 'new row violates row-level security policy' };
      const message = getAuthErrorMessage(error);
      expect(message).toContain('session');
    });

    it('should return French message for expired JWT', () => {
      const error = { message: 'JWT expired' };
      const message = getAuthErrorMessage(error);
      expect(message).toContain('expiré');
    });

    it('should return generic message for unknown errors', () => {
      const error = { message: 'Unknown error' };
      const message = getAuthErrorMessage(error);
      expect(message).toContain('authentification');
    });
  });

  describe('Error Pattern Detection', () => {
    const rlsPatterns = [
      'new row violates row-level security policy',
      'violates row-level security',
      'RLS policy violation'
    ];

    const jwtExpiredPatterns = [
      'JWT expired',
      'token has expired',
      'Token expired'
    ];

    const jwtInvalidPatterns = [
      'Invalid JWT',
      'invalid token',
      'JWT verification failed',
      'Invalid refresh token'
    ];

    const unauthorizedPatterns = [
      'Unauthorized',
      'not authenticated',
      'Authentication required'
    ];

    rlsPatterns.forEach(pattern => {
      it(`should detect RLS pattern: "${pattern}"`, () => {
        const result = handleSupabaseError({ message: pattern });
        expect(result.errorType).toBe('rls_violation');
      });
    });

    jwtExpiredPatterns.forEach(pattern => {
      it(`should detect JWT expired pattern: "${pattern}"`, () => {
        const result = handleSupabaseError({ message: pattern });
        expect(result.errorType).toBe('jwt_expired');
      });
    });

    jwtInvalidPatterns.forEach(pattern => {
      it(`should detect JWT invalid pattern: "${pattern}"`, () => {
        const result = handleSupabaseError({ message: pattern });
        expect(result.errorType).toBe('jwt_invalid');
      });
    });

    unauthorizedPatterns.forEach(pattern => {
      it(`should detect unauthorized pattern: "${pattern}"`, () => {
        const result = handleSupabaseError({ message: pattern });
        expect(result.errorType).toBe('unauthorized');
      });
    });
  });
});
