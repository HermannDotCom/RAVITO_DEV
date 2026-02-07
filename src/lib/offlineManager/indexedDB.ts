/**
 * IndexedDB Manager for RAVITO Offline Mode
 * Stores daily sheets and related data for offline access
 */

const DB_NAME = 'ravito-offline';
const DB_VERSION = 1;

interface OfflineStore {
  dailySheets: 'daily_sheets';
  stockLines: 'daily_stock_lines';
  packaging: 'daily_packaging';
  expenses: 'daily_expenses';
  pendingActions: 'pending_actions';
}

const STORES: OfflineStore = {
  dailySheets: 'daily_sheets',
  stockLines: 'daily_stock_lines',
  packaging: 'daily_packaging',
  expenses: 'daily_expenses',
  pendingActions: 'pending_actions',
};

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create stores for offline data
      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          
          if (storeName === 'pending_actions') {
            store.createIndex('status', 'status', { unique: false });
          }
        }
      });
    };
  });
};

export const saveToStore = async <T extends { id: string }>(
  storeName: string,
  data: T
): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.put({ ...data, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFromStore = async <T>(
  storeName: string,
  id: string
): Promise<T | undefined> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFromStore = async (
  storeName: string,
  id: string
): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export { STORES };
