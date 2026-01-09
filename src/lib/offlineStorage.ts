// IndexedDB wrapper for offline data storage
const DB_NAME = 'ConstructionEstimatorDB';
const DB_VERSION = 1;

export interface OfflineData {
  id: string;
  type: 'photo' | 'voice' | 'estimate';
  data: any;
  location?: { latitude: number; longitude: number };
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offline_data')) {
          const store = db.createObjectStore('offline_data', { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async save(data: OfflineData): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('offline_data', 'readwrite');
      const store = tx.objectStore('offline_data');
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsynced(): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('offline_data', 'readonly');
      const store = tx.objectStore('offline_data');
      const index = store.index('synced');
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('offline_data', 'readwrite');
      const store = tx.objectStore('offline_data');
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          store.put(data);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
