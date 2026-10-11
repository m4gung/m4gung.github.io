import type { SyncQueueItem } from '../db/cafeDb';

export class SpringAdapter {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/sync/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncBatch(outletId: number, items: SyncQueueItem[]): Promise<string[]> {
    const payload = {
      outletId,
      items: items.map((i) => ({
        clientSyncId: i.clientSyncId,
        entityType: i.entityType,
        action: i.action,
        payload: i.payload
      }))
    };

    const batchIdempotencyKey = `SYNC-BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': batchIdempotencyKey
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}/sync/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal sinkronisasi ke Spring Boot backend');
    }

    const resJson = await res.json();
    return resJson.data?.acknowledgedSyncIds || [];
  }
}
