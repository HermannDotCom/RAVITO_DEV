import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { syncManager, SyncStatus } from '../lib/syncManager';
import { getPendingActionsCount, getPendingActions, PendingAction } from '../lib/offlineManager';
import { getLastSyncTime } from '../lib/offlineStorage';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  pendingActionsCount: number;
  pendingActions: PendingAction[];
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  forceSync: () => Promise<void>;
  refreshPendingActions: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => syncManager.getIsOnline());
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncManager.getSyncStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const isSyncing = syncStatus === 'syncing';

  const refreshPendingActions = useCallback(async () => {
    try {
      const [count, actions] = await Promise.all([
        getPendingActionsCount(),
        getPendingActions(),
      ]);
      setPendingActionsCount(count);
      setPendingActions(actions);
    } catch (error) {
      console.error('Error refreshing pending actions:', error);
    }
  }, []);

  const refreshLastSyncTime = useCallback(async () => {
    try {
      const timestamp = await getLastSyncTime('global');
      setLastSyncTime(timestamp ? new Date(timestamp) : null);
    } catch {
      // non-critical
    }
  }, []);

  const forceSync = useCallback(async () => {
    await syncManager.forceSync();
    await refreshPendingActions();
    await refreshLastSyncTime();
  }, [refreshPendingActions, refreshLastSyncTime]);

  useEffect(() => {
    refreshPendingActions();
    refreshLastSyncTime();

    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingActions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeStatus = syncManager.onStatusChange((status) => {
      setSyncStatus(status);
    });

    const unsubscribeSuccess = syncManager.onSuccess(() => {
      refreshPendingActions();
      refreshLastSyncTime();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeStatus();
      unsubscribeSuccess();
    };
  }, [refreshPendingActions, refreshLastSyncTime]);

  // Refresh pending actions periodically when offline
  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(refreshPendingActions, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, refreshPendingActions]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineMode: !isOnline,
        pendingActionsCount,
        pendingActions,
        isSyncing,
        syncStatus,
        lastSyncTime,
        forceSync,
        refreshPendingActions,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
