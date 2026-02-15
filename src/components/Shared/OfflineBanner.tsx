import React from 'react';
import { CloudOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OfflineBanner: React.FC = () => {
  const { isOfflineMode } = useAuth();

  if (!isOfflineMode) {
    return null;
  }

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center space-x-2 text-amber-800">
        <CloudOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          Mode hors ligne
        </span>
        <span className="hidden sm:inline text-sm">
          - Certaines fonctionnalités sont limitées
        </span>
        <AlertCircle className="h-4 w-4 hidden sm:inline" />
      </div>
    </div>
  );
};
