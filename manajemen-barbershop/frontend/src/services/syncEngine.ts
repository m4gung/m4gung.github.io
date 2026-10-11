import { db } from '../db';
import type { SyncOutboxItem } from '../types';

export class SyncEngine {
  private static isSyncing = false;
  private static listeners: Array<(isOnline: boolean, pendingCount: number) => void> = [];

  public static init() {
    window.addEventListener('online', () => {
      this.notifyListeners();
      this.triggerAutoSync();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    // Jalankan auto-sync awal jika online
    if (navigator.onLine) {
      setTimeout(() => this.triggerAutoSync(), 2000);
    }
  }

  public static subscribe(listener: (isOnline: boolean, pendingCount: number) => void) {
    this.listeners.push(listener);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public static async getPendingCount(): Promise<number> {
    return await db.syncOutbox.where('status').equals('PENDING').count();
  }

  public static async notifyListeners() {
    const isOnline = navigator.onLine;
    const pendingCount = await this.getPendingCount();
    this.listeners.forEach(cb => cb(isOnline, pendingCount));
  }

  public static async addToOutbox(
    entityType: SyncOutboxItem['entityType'],
    action: SyncOutboxItem['action'],
    payload: any
  ) {
    const item: SyncOutboxItem = {
      id: 'outbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      entityType,
      action,
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.syncOutbox.put(item);
    this.notifyListeners();

    if (navigator.onLine) {
      this.triggerAutoSync();
    }
  }

  public static async triggerAutoSync(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: false, syncedCount: 0, message: 'Tidak dapat sinkronisasi saat offline atau sedang proses.' };
    }

    const settings = await db.settings.get('default');
    if (!settings) {
      return { success: false, syncedCount: 0, message: 'Pengaturan sistem belum ditemukan.' };
    }

    const pendingItems = await db.syncOutbox.where('status').equals('PENDING').toArray();
    if (pendingItems.length === 0) {
      return { success: true, syncedCount: 0, message: 'Semua data lokal telah tersinkronisasi.' };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      if (settings.storageMode === 'GOOGLE_SHEETS' || settings.storageMode === 'HYBRID') {
        if (!settings.googleAppsScriptUrl) {
          this.isSyncing = false;
          return { success: false, syncedCount: 0, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
        }

        for (const item of pendingItems) {
          try {
            await db.syncOutbox.update(item.id, { status: 'SYNCING' });

            let endpointAction = '';
            if (item.entityType === 'TRANSACTION') endpointAction = 'create_transaction';
            else if (item.entityType === 'ATTENDANCE') endpointAction = 'create_attendance';
            else if (item.entityType === 'PRODUCT_STOCK') endpointAction = 'update_stock';

            if (endpointAction) {
              const res = await fetch(settings.googleAppsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS webhook requirement
                body: JSON.stringify({
                  action: endpointAction,
                  payload: item.payload
                })
              });

              if (res.ok) {
                await db.syncOutbox.update(item.id, {
                  status: 'SUCCESS',
                  syncedAt: new Date().toISOString()
                });
                syncedCount++;
              } else {
                throw new Error(`HTTP Error: ${res.status}`);
              }
            }
          } catch (err: any) {
            await db.syncOutbox.update(item.id, {
              status: 'PENDING',
              retryCount: item.retryCount + 1,
              lastErrorMessage: err.message
            });
          }
        }
      }

      // Spring Boot Mode
      if (settings.storageMode === 'SPRING_BOOT') {
        // Mock sync / direct API call to Spring Boot
        for (const item of pendingItems) {
          try {
            const url = `${settings.springBootApiUrl}/sync`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            if (res.ok) {
              await db.syncOutbox.update(item.id, { status: 'SUCCESS', syncedAt: new Date().toISOString() });
              syncedCount++;
            }
          } catch (err: any) {
            await db.syncOutbox.update(item.id, {
              status: 'PENDING',
              retryCount: item.retryCount + 1,
              lastErrorMessage: err.message
            });
          }
        }
      }

      this.notifyListeners();
      return { success: true, syncedCount, message: `Berhasil menyinkronkan ${syncedCount} data ke server.` };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public static async testGoogleSheetsConnection(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${url}?action=ping`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, message: data.message || 'Koneksi ke Google Spreadsheet Berhasil!' };
    } catch (err: any) {
      return { success: false, message: 'Gagal terhubung: ' + err.message };
    }
  }
}
