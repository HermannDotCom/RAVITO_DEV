import React from 'react';
import { CloudOff, RefreshCw, Clock, UploadCloud } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

export const OfflineBanner: React.FC = () => {
  const { isOfflineMode, isOnline, pendingActionsCount, isSyncing, lastSyncTime, forceSync, syncStatus } =
    useOffline();

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  // En ligne ET sync terminée avec succès : afficher brièvement si des actions ont été synchro
  if (!isOfflineMode && pendingActionsCount === 0 && syncStatus !== 'syncing') {
    return null;
  }

  // En ligne mais des actions en attente ou en cours de sync
  if (isOnline && (pendingActionsCount > 0 || isSyncing)) {
    return (
      <div
        className="bg-blue-50 border-b border-blue-200 px-4 py-2"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 text-blue-800">
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isSyncing
                ? 'Synchronisation en cours...'
                : `${pendingActionsCount} action${pendingActionsCount > 1 ? 's' : ''} en attente de synchronisation`}
            </span>
            {lastSyncTime && !isSyncing && (
              <span className="hidden sm:flex items-center space-x-1 text-xs text-blue-600">
                <Clock className="h-3 w-3" />
                <span>Dernière sync {formatTime(lastSyncTime)}</span>
              </span>
            )}
          </div>
          {!isSyncing && pendingActionsCount > 0 && (
            <button
              onClick={forceSync}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
              aria-label="Synchroniser maintenant"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Synchroniser</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Hors ligne
  if (isOfflineMode) {
    return (
      <div
        className="bg-amber-50 border-b border-amber-200 px-4 py-2"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 text-amber-800">
            <CloudOff className="h-4 w-4 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium">Mode hors ligne</span>
              <span className="hidden sm:inline text-sm text-amber-700">
                {' '}— Consultation uniquement, vos modifications seront envoyées au retour du réseau
              </span>
            </div>
          </div>
          {pendingActionsCount > 0 && (
            <span className="flex items-center space-x-1 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">
              <span>{pendingActionsCount}</span>
              <span className="hidden sm:inline">en attente</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
};
