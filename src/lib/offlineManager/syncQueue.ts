/**
 * Sync Queue Manager
 * Handles queuing and syncing of offline actions
 */

import { saveToStore, getAllFromStore, deleteFromStore, STORES } from './indexedDB';

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  error?: string;
}

const MAX_RETRIES = 3;

export const addPendingAction = async (
  action: Omit<PendingAction, 'id' | 'timestamp' | 'status' | 'retryCount'>
): Promise<string> => {
  const id = `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const pendingAction: PendingAction = {
    ...action,
    id,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  await saveToStore(STORES.pendingActions, pendingAction);
  console.log('Added pending action:', pendingAction);
  
  return id;
};

export const getPendingActions = async (): Promise<PendingAction[]> => {
  const actions = await getAllFromStore<PendingAction>(STORES.pendingActions);
  return actions.filter(a => a.status !== 'syncing').sort((a, b) => a.timestamp - b.timestamp);
};

export const getPendingActionsCount = async (): Promise<number> => {
  const actions = await getPendingActions();
  return actions.length;
};

export const markActionAsSyncing = async (id: string): Promise<void> => {
  const actions = await getAllFromStore<PendingAction>(STORES.pendingActions);
  const action = actions.find(a => a.id === id);
  
  if (action) {
    action.status = 'syncing';
    await saveToStore(STORES.pendingActions, action);
  }
};

export const markActionAsFailed = async (id: string, error: string): Promise<void> => {
  const actions = await getAllFromStore<PendingAction>(STORES.pendingActions);
  const action = actions.find(a => a.id === id);
  
  if (action) {
    action.status = 'failed';
    action.error = error;
    action.retryCount += 1;
    
    if (action.retryCount >= MAX_RETRIES) {
      console.error(`Action ${id} failed after ${MAX_RETRIES} retries, removing from queue`);
      await deleteFromStore(STORES.pendingActions, id);
    } else {
      await saveToStore(STORES.pendingActions, action);
    }
  }
};

export const removeAction = async (id: string): Promise<void> => {
  await deleteFromStore(STORES.pendingActions, id);
  console.log('Removed synced action:', id);
};

export const clearAllPendingActions = async (): Promise<void> => {
  const actions = await getAllFromStore<PendingAction>(STORES.pendingActions);
  for (const action of actions) {
    await deleteFromStore(STORES.pendingActions, action.id);
  }
};
