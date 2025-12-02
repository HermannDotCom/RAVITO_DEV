import React from 'react';
import { AlertTriangle, RefreshCw, LogOut, X } from 'lucide-react';

interface SessionErrorBannerProps {
  error: string;
  isRecovering: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onDismiss?: () => void;
}

/**
 * SessionErrorBanner Component
 * 
 * Displays a banner at the top of the screen when a session error is detected.
 * Provides options to refresh the session or log out.
 * 
 * Uses the existing design system colors (orange/green) and Tailwind CSS.
 */
export const SessionErrorBanner: React.FC<SessionErrorBannerProps> = ({
  error,
  isRecovering,
  onRefresh,
  onLogout,
  onDismiss
}) => {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Error message section */}
          <div className="flex items-start sm:items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">
                Problème de session détecté
              </p>
              <p className="text-sm text-orange-100 mt-0.5 truncate">
                {error}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onRefresh}
              disabled={isRecovering}
              className={`
                flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg
                transition-all duration-200
                ${isRecovering 
                  ? 'bg-orange-400 cursor-not-allowed opacity-75' 
                  : 'bg-white text-orange-600 hover:bg-orange-50 active:bg-orange-100'
                }
                flex-1 sm:flex-initial
              `}
              aria-label={isRecovering ? 'Actualisation en cours...' : 'Actualiser la session'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
              <span className={isRecovering ? 'text-white' : ''}>
                {isRecovering ? 'Actualisation...' : 'Actualiser la session'}
              </span>
            </button>

            <button
              onClick={onLogout}
              disabled={isRecovering}
              className={`
                flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg
                border border-white/30 text-white
                transition-all duration-200
                ${isRecovering 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/10 active:bg-white/20'
                }
                flex-1 sm:flex-initial
              `}
              aria-label="Se reconnecter"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Se reconnecter</span>
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
