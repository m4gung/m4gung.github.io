import type { SyncQueueItem } from '../db/cafeDb';

export class GasAdapter {
  private gasUrl: string;

  constructor(gasUrl: string = '') {
    this.gasUrl = gasUrl;
  }

  setGasUrl(url: string) {
    this.gasUrl = url;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.gasUrl) return false;
    try {
      const res = await fetch(`${this.gasUrl}?action=health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncBatch(outletId: number, items: SyncQueueItem[]): Promise<string[]> {
    if (!this.gasUrl) {
      throw new Error('URL Google Apps Script belum diatur pada Pengaturan.');
    }

    const payload = {
      action: 'sync_batch',
      outletId: String(outletId),
      items: items.map((i) => ({
        clientSyncId: i.clientSyncId,
        entityType: i.entityType,
        action: i.action,
        payload: i.payload
      }))
    };

    // Google Apps Script redirect handling with fetch
    const res = await fetch(this.gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GAS works best without preflight CORS
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Gagal mengirim data ke Google Apps Script');
    }

    const resJson = await res.json();
    return resJson.acknowledgedSyncIds || [];
  }
}
