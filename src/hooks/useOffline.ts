/**
 * useOffline Hook
 * Provides offline state and sync management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatus } from '../lib/syncManager';
import { getPendingActionsCount } from '../lib/offlineManager';
import { getLastSyncTime } from '../lib/offlineStorage';

export interface UseOfflineReturn {
  isOnline: boolean;
  isOfflineMode: boolean;
  hasPendingActions: boolean;
  pendingActionsCount: number;
  lastSyncTime: Date | null;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
}

/**
 * Hook to manage offline state and sync operations
 */
export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(syncManager.getIsOnline());
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getSyncStatus());

  // Update pending actions count
  const updatePendingActions = useCallback(async () => {
    try {
      const count = await getPendingActionsCount();
      setPendingActionsCount(count);
    } catch (error) {
      console.error('Error updating pending actions count:', error);
    }
  }, []);

  // Update last sync time
  const updateLastSyncTime = useCallback(async () => {
    try {
      const timestamp = await getLastSyncTime('global');
      setLastSyncTime(timestamp ? new Date(timestamp) : null);
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }, []);

  // Force sync
  const forceSync = useCallback(async () => {
    try {
      await syncManager.forceSync();
      await updatePendingActions();
      await updateLastSyncTime();
    } catch (error) {
      console.error('Error during force sync:', error);
      throw error;
    }
  }, [updatePendingActions, updateLastSyncTime]);

  // Initialize
  useEffect(() => {
    // Update initial state
    updatePendingActions();
    updateLastSyncTime();

    // Listen to browser online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to sync status changes
    const unsubscribeStatus = syncManager.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // Listen to sync success
    const unsubscribeSuccess = syncManager.onSuccess(() => {
      updatePendingActions();
      updateLastSyncTime();
    });

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeStatus();
      unsubscribeSuccess();
    };
  }, [updatePendingActions, updateLastSyncTime]);

  // Poll pending actions when offline (every 15 seconds to conserve battery)
  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(updatePendingActions, 15000);
      return () => clearInterval(interval);
    }
  }, [isOnline, updatePendingActions]);

  const isOfflineMode = !isOnline;
  const hasPendingActions = pendingActionsCount > 0;

  return {
    isOnline,
    isOfflineMode,
    hasPendingActions,
    pendingActionsCount,
    lastSyncTime,
    syncStatus,
    forceSync,
  };
};
