import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { realtimeService } from '../services/realtimeService';
import { getPendingActionsCount, getPendingActions, PendingAction } from '../lib/offlineManager';

interface OfflineContextType {
  isOnline: boolean;
  pendingActionsCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingActions: PendingAction[];
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
  const [isOnline, setIsOnline] = useState(realtimeService.getIsOnline());
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const refreshPendingActions = useCallback(async () => {
    try {
      const count = await getPendingActionsCount();
      const actions = await getPendingActions();
      setPendingActionsCount(count);
      setPendingActions(actions);
    } catch (error) {
      console.error('Error refreshing pending actions:', error);
    }
  }, []);

  useEffect(() => {
    // Subscribe to online status changes from realtimeService
    const unsubscribe = realtimeService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      
      if (online) {
        // Trigger sync when coming back online
        setIsSyncing(true);
        refreshPendingActions().then(() => {
          setLastSyncTime(new Date());
          setIsSyncing(false);
        });
      }
    });

    // Initial load of pending actions
    refreshPendingActions();

    return () => {
      unsubscribe();
    };
  }, [refreshPendingActions]);

  // Refresh pending actions periodically when offline
  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(refreshPendingActions, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, refreshPendingActions]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingActionsCount,
        isSyncing,
        lastSyncTime,
        pendingActions,
        refreshPendingActions,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
