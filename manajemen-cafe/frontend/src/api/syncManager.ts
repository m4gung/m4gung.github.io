import { db, type SyncQueueItem } from '../db/cafeDb';
import { SpringAdapter } from './springAdapter';
import { GasAdapter } from './gasAdapter';

export type BackendMode = 'SPRING_BOOT' | 'APPS_SCRIPT' | 'DUAL';
export type SyncStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';

export class SyncManager {
  private springAdapter = new SpringAdapter();
  private gasAdapter = new GasAdapter();
  private isSyncing = false;
  private listeners: Array<(status: SyncStatus, pendingCount: number) => void> = [];

  constructor() {
    window.addEventListener('online', () => this.handleNetworkChange());
    window.addEventListener('offline', () => this.handleNetworkChange());
    // Auto-sync interval every 30 seconds if online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.triggerSync();
      }
    }, 30000);
  }

  subscribe(listener: (status: SyncStatus, pendingCount: number) => void) {
    this.listeners.push(listener);
    this.notifyStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notifyStatus(status: SyncStatus) {
    const pendingCount = await db.syncQueue.where('status').equals('PENDING').count();
    this.listeners.forEach((l) => l(status, pendingCount));
  }

  private handleNetworkChange() {
    if (navigator.onLine) {
      this.notifyStatus('ONLINE');
      this.triggerSync();
    } else {
      this.notifyStatus('OFFLINE');
    }
  }

  setToken(token: string | null) {
    this.springAdapter.setToken(token);
  }

  async queueItem(
    entityType: 'ORDER' | 'PAYMENT' | 'EXPENSE' | 'MENU',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payloadObj: any
  ): Promise<string> {
    const clientSyncId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const item: SyncQueueItem = {
      clientSyncId,
      entityType,
      action,
      payload: JSON.stringify(payloadObj),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await db.syncQueue.put(item);
    this.notifyStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');

    // Trigger sync in background if online
    if (navigator.onLine) {
      this.triggerSync();
    }

    return clientSyncId;
  }

  async triggerSync(): Promise<{ success: boolean; syncedCount: number; message?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, message: 'Sinkronisasi sedang berlangsung' };
    if (!navigator.onLine) {
      this.notifyStatus('OFFLINE');
      return { success: false, syncedCount: 0, message: 'Perangkat sedang offline' };
    }

    this.isSyncing = true;
    this.notifyStatus('SYNCING');

    try {
      const modeSetting = await db.appSettings.get('backendMode');
      const gasUrlSetting = await db.appSettings.get('gasUrl');
      const activeOutletSetting = await db.appSettings.get('activeOutletId');

      const backendMode: BackendMode = (modeSetting?.value as BackendMode) || 'SPRING_BOOT';
      const gasUrl: string = gasUrlSetting?.value || '';
      const outletId: number = Number(activeOutletSetting?.value) || 1;

      this.gasAdapter.setGasUrl(gasUrl);

      const pendingItems = await db.syncQueue.where('status').equals('PENDING').toArray();
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notifyStatus('ONLINE');
        return { success: true, syncedCount: 0 };
      }

      let springAcknowledged: string[] = [];
      let gasAcknowledged: string[] = [];

      // 1. Spring Boot Sync
      if (backendMode === 'SPRING_BOOT' || backendMode === 'DUAL') {
        try {
          springAcknowledged = await this.springAdapter.syncBatch(outletId, pendingItems);
        } catch (err: any) {
          console.warn('Sync to Spring Boot failed:', err.message);
          if (backendMode === 'SPRING_BOOT') {
            throw err;
          }
        }
      }

      // 2. Google Apps Script Sync
      if (backendMode === 'APPS_SCRIPT' || backendMode === 'DUAL') {
        if (gasUrl) {
          try {
            gasAcknowledged = await this.gasAdapter.syncBatch(outletId, pendingItems);
          } catch (err: any) {
            console.warn('Sync to Google Apps Script failed:', err.message);
            if (backendMode === 'APPS_SCRIPT') {
              throw err;
            }
          }
        }
      }

      // Combine acknowledged IDs
      const acknowledgedSet = new Set([...springAcknowledged, ...gasAcknowledged]);

      for (const item of pendingItems) {
        if (acknowledgedSet.has(item.clientSyncId)) {
          await db.syncQueue.update(item.id!, { status: 'SYNCED' });
        }
      }

      this.isSyncing = false;
      this.notifyStatus('ONLINE');
      return { success: true, syncedCount: acknowledgedSet.size };
    } catch (err: any) {
      this.isSyncing = false;
      this.notifyStatus('ERROR');
      return { success: false, syncedCount: 0, message: err.message || 'Gagal sinkronisasi' };
    }
  }
}

export const syncManager = new SyncManager();
