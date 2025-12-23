import React from 'react';
import { ShieldX } from 'lucide-react';
import { useModuleAccess } from '../../hooks/useModuleAccess';

interface ProtectedModuleProps {
  moduleKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  redirectTo?: string;
}

/**
 * Component to protect access to a module/page based on user permissions
 */
export const ProtectedModule: React.FC<ProtectedModuleProps> = ({
  moduleKey,
  children,
  fallback,
  showAccessDenied = true,
  redirectTo
}) => {
  const { hasAccess, isLoading } = useModuleAccess();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Check access
  if (!hasAccess(moduleKey)) {
    // Redirect if specified
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }

    // Show custom fallback
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show access denied message
    if (showAccessDenied) {
      return <AccessDeniedMessage moduleKey={moduleKey} />;
    }

    // No access, no fallback, no message
    return null;
  }

  // User has access, render children
  return <>{children}</>;
};

/**
 * Default access denied message component
 */
export const AccessDeniedMessage: React.FC<{ moduleKey: string }> = ({ moduleKey }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <ShieldX className="h-16 w-16 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Accès non autorisé
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-1">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
        Contactez le propriétaire de votre organisation pour obtenir l'accès au module <strong>{moduleKey}</strong>.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-6 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        Retour
      </button>
    </div>
  );
};
