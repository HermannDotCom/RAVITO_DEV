/**
 * Sync Manager for RAVITO Offline Mode
 * Handles synchronization of offline actions and data caching
 */

import { realtimeService } from '../services/realtimeService';
import { supabase } from './supabase';
import {
  getPendingActions,
  removeAction,
  markActionAsSyncing,
  markActionAsFailed,
  PendingAction,
} from './offlineManager';
import {
  cacheUserProfile,
  cacheOrganization,
  cacheSubscription,
  cacheTeamMembers,
  setLastSyncTime,
} from './offlineStorage';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface SyncEventHandlers {
  onStatusChange?: (status: SyncStatus) => void;
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncStatus: SyncStatus = 'idle';
  private eventHandlers: SyncEventHandlers = {};
  private autoSyncEnabled: boolean = true;

  constructor() {
    this.init();
  }

  /**
   * Initialize sync manager
   */
  private init(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen to realtime service online status changes
    realtimeService.onOnlineStatusChange((online) => {
      this.isOnline = online;
      if (online && this.autoSyncEnabled) {
        console.log('📶 Network restored, triggering auto-sync...');
        this.syncOfflineActions();
      }
    });

    // Initial state
    this.isOnline = realtimeService.getIsOnline();

    console.log('✅ Sync manager initialized, online:', this.isOnline);
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    console.log('📶 Browser reports online');
    this.isOnline = true;
    if (this.autoSyncEnabled) {
      this.syncOfflineActions();
    }
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    console.log('📵 Browser reports offline');
    this.isOnline = false;
    this.setSyncStatus('idle');
  };

  /**
   * Set sync status and notify handlers
   */
  private setSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.eventHandlers.onStatusChange?.(status);
  }

  /**
   * Get current online status
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Register event handlers
   */
  public onStatusChange(handler: (status: SyncStatus) => void): () => void {
    this.eventHandlers.onStatusChange = handler;
    return () => {
      this.eventHandlers.onStatusChange = undefined;
    };
  }

  public onProgress(handler: (current: number, total: number) => void): () => void {
    this.eventHandlers.onProgress = handler;
    return () => {
      this.eventHandlers.onProgress = undefined;
    };
  }

  public onError(handler: (error: Error) => void): () => void {
    this.eventHandlers.onError = handler;
    return () => {
      this.eventHandlers.onError = undefined;
    };
  }

  public onSuccess(handler: () => void): () => void {
    this.eventHandlers.onSuccess = handler;
    return () => {
      this.eventHandlers.onSuccess = undefined;
    };
  }

  /**
   * Enable or disable auto-sync
   */
  public setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    console.log('Auto-sync', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Manually trigger sync
   */
  public async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.syncOfflineActions();
  }

  /**
   * Sync all pending offline actions
   */
  public async syncOfflineActions(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline) {
      console.log('📵 Cannot sync while offline');
      return;
    }

    this.isSyncing = true;
    this.setSyncStatus('syncing');

    try {
      const pendingActions = await getPendingActions();
      
      if (pendingActions.length === 0) {
        console.log('✅ No pending actions to sync');
        this.setSyncStatus('success');
        this.eventHandlers.onSuccess?.();
        return;
      }

      console.log(`🔄 Syncing ${pendingActions.length} pending actions...`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];
        this.eventHandlers.onProgress?.(i + 1, pendingActions.length);

        try {
          await this.syncAction(action);
          await removeAction(action.id);
          successCount++;
          console.log(`✅ Action synced successfully: ${action.id}`);
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to sync action ${action.id}:`, errorMessage);
          await markActionAsFailed(action.id, errorMessage);
        }
      }

      console.log(`✅ Sync completed: ${successCount} succeeded, ${errorCount} failed`);

      if (errorCount > 0) {
        this.setSyncStatus('error');
        this.eventHandlers.onError?.(new Error(`${errorCount} actions failed to sync`));
      } else {
        this.setSyncStatus('success');
        this.eventHandlers.onSuccess?.();
      }

      // Update last sync time
      await setLastSyncTime('global', Date.now());
    } catch (error) {
      console.error('❌ Sync error:', error);
      this.setSyncStatus('error');
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: PendingAction): Promise<void> {
    await markActionAsSyncing(action.id);

    const { type, table, data } = action;

    try {
      switch (type) {
        case 'create': {
          const { error } = await supabase.from(table).insert(data);
          if (error) {
            throw new Error(`Failed to create in ${table}: ${error.message}`);
          }
          break;
        }

        case 'update': {
          if (!data.id) {
            throw new Error('Update action requires id in data');
          }
          const { error } = await supabase.from(table).update(data).eq('id', data.id);
          if (error) {
            throw new Error(`Failed to update in ${table}: ${error.message}`);
          }
          break;
        }

        case 'delete': {
          if (!data.id) {
            throw new Error('Delete action requires id in data');
          }
          const { error } = await supabase.from(table).delete().eq('id', data.id);
          if (error) {
            throw new Error(`Failed to delete from ${table}: ${error.message}`);
          }
          break;
        }

        default:
          throw new Error(`Unknown action type: ${type}`);
      }
    } catch (error) {
      // Re-throw with action context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Action ${action.id} (${type} on ${table}): ${errorMessage}`);
    }
  }

  /**
   * Cache user data for offline access
   */
  public async cacheUserData(userId: string, organizationId?: string): Promise<void> {
    if (!this.isOnline) {
      console.log('📵 Cannot cache data while offline');
      return;
    }

    try {
      console.log('💾 Caching user data for offline access...');

      // Fetch and cache user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        await cacheUserProfile(userId, profile);
      }

      // If user has an organization, cache related data
      if (organizationId) {
        // Cache organization
        const { data: organization } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (organization) {
          await cacheOrganization(organizationId, organization);
        }

        // Cache subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (subscription) {
          await cacheSubscription(organizationId, subscription);
        }

        // Cache team members
        const { data: teamMembers } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', organizationId);

        if (teamMembers) {
          await cacheTeamMembers(organizationId, teamMembers);
        }
      }

      await setLastSyncTime('userDataCache', Date.now());
      console.log('✅ User data cached successfully');
    } catch (error) {
      console.error('❌ Error caching user data:', error);
      throw error;
    }
  }

  /**
   * Cleanup sync manager
   */
  public cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.eventHandlers = {};
    console.log('🧹 Sync manager cleaned up');
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
