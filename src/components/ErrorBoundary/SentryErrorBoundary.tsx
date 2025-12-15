import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetError }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oups ! Une erreur s'est produite
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-6">
          Nous avons été notifiés et travaillons à résoudre le problème. 
          Veuillez réessayer ou retourner à l'accueil.
        </p>
        
        {/* Error details (dev only) */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Accueil
          </button>
        </div>
        
        {/* Support link */}
        <p className="mt-6 text-sm text-gray-500">
          Le problème persiste ?{' '}
          <a 
            href="mailto:support@ravito.ci" 
            className="text-orange-600 hover:underline"
          >
            Contactez le support
          </a>
        </p>
      </div>
    </div>
  );
};

// Wrapper avec Sentry Error Boundary
export const SentryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error, componentStack) => {
        console.error('[SentryErrorBoundary] Error caught:', error);
        console.error('[SentryErrorBoundary] Component stack:', componentStack);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default SentryErrorBoundary;
