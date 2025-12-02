import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SessionRecoveryState {
  isRecovering: boolean;
  sessionError: string | null;
  recoveryAttempts: number;
}

export interface UseSessionRecoveryReturn extends SessionRecoveryState {
  attemptRecovery: () => Promise<boolean>;
  clearError: () => void;
  setSessionError: (error: string | null) => void;
  forceLogout: () => Promise<void>;
}

const MAX_RECOVERY_ATTEMPTS = 2;

/**
 * Hook for managing session recovery attempts
 * 
 * This hook provides functionality to:
 * - Attempt automatic session refresh via Supabase
 * - Track recovery attempts (max 2 attempts)
 * - Expose session error state
 * - Provide a force logout option when recovery fails
 */
export function useSessionRecovery(): UseSessionRecoveryReturn {
  const [isRecovering, setIsRecovering] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const lastAttemptTimeRef = useRef<number>(0);

  /**
   * Attempts to refresh the session
   * Returns true if successful, false otherwise
   */
  const attemptRecovery = useCallback(async (): Promise<boolean> => {
    // Prevent rapid successive attempts (minimum 2 seconds between attempts)
    const now = Date.now();
    if (now - lastAttemptTimeRef.current < 2000) {
      console.log('[SessionRecovery] Skipping recovery - too soon since last attempt');
      return false;
    }

    // Check if we've exceeded max attempts
    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.log('[SessionRecovery] Max recovery attempts reached');
      setSessionError('La récupération de session a échoué. Veuillez vous reconnecter.');
      return false;
    }

    lastAttemptTimeRef.current = now;
    setIsRecovering(true);

    try {
      console.log(`[SessionRecovery] Attempting session refresh (attempt ${recoveryAttempts + 1}/${MAX_RECOVERY_ATTEMPTS})`);
      
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[SessionRecovery] Session refresh failed:', error);
        setRecoveryAttempts(prev => prev + 1);
        
        if (recoveryAttempts + 1 >= MAX_RECOVERY_ATTEMPTS) {
          setSessionError('La récupération de session a échoué. Veuillez vous reconnecter.');
        } else {
          setSessionError('Erreur lors de la récupération de session. Réessayez ou reconnectez-vous.');
        }
        
        return false;
      }

      if (data.session) {
        console.log('[SessionRecovery] Session refreshed successfully');
        setSessionError(null);
        setRecoveryAttempts(0);
        return true;
      }

      console.warn('[SessionRecovery] No session returned after refresh');
      setRecoveryAttempts(prev => prev + 1);
      setSessionError('Session non trouvée. Veuillez vous reconnecter.');
      return false;

    } catch (error) {
      console.error('[SessionRecovery] Unexpected error during recovery:', error);
      setRecoveryAttempts(prev => prev + 1);
      setSessionError('Une erreur inattendue s\'est produite. Veuillez vous reconnecter.');
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [recoveryAttempts]);

  /**
   * Clears the session error and resets recovery attempts
   */
  const clearError = useCallback(() => {
    setSessionError(null);
    setRecoveryAttempts(0);
    lastAttemptTimeRef.current = 0;
  }, []);

  /**
   * Forces a logout when recovery is not possible
   */
  const forceLogout = useCallback(async () => {
    try {
      console.log('[SessionRecovery] Forcing logout');
      await supabase.auth.signOut();
      clearError();
    } catch (error) {
      console.error('[SessionRecovery] Error during forced logout:', error);
      // Force clear local state even if signOut fails
      clearError();
    }
  }, [clearError]);

  return {
    isRecovering,
    sessionError,
    recoveryAttempts,
    attemptRecovery,
    clearError,
    setSessionError,
    forceLogout
  };
}
