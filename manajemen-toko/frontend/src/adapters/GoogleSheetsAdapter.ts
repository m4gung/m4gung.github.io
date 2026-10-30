import type { IDataProvider, CheckoutPayload, PayReceivablePayload, CreateManualJournalPayload } from './IDataProvider';
import { IndexedDbAdapter } from './IndexedDbAdapter';
import { db } from '../db/indexedDb';
import type { 
  Product, 
  Category,
  StockMutation,
  Customer, 
  Sale, 
  Receivable, 
  StoreSettings, 
  InitialDataResponse,
  JournalLine,
  ChartOfAccount,
  Supplier,
  Purchase,
  CreatePurchasePayload
} from '../types';

export class GoogleSheetsAdapter implements IDataProvider {
  name = 'Google Sheets (Serverless Web App API)';
  private scriptUrl: string;
  private localFallback: IndexedDbAdapter;

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
    this.localFallback = new IndexedDbAdapter();
  }

  setScriptUrl(url: string) {
    this.scriptUrl = url;
  }

  // Memicu sinkronisasi antrean outbox di latar belakang secara asinkron tanpa memblokir UI
  private triggerBackgroundSync() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toko:trigger-outbox-sync'));
    }
  }

  // Eksekusi aksi outbox langsung ke Google Apps Script tanpa masuk ke queue lokal lagi
  async executeCloudAction(action: string, payload: any): Promise<any> {
    return await this.callApi(action, payload, 'POST');
  }

  private async callApi(action: string, payload?: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    if (!this.scriptUrl) {
      throw new Error('URL Web App Google Sheets belum diatur di menu Pengaturan.');
    }

    if (method === 'GET') {
      const url = new URL(this.scriptUrl);
      url.searchParams.append('action', action);
      const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal memproses request di Google Sheets');
      return json.data;
    } else {
      const res = await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal memproses request di Google Sheets');
      return json.data;
    }
  }

  async ping(): Promise<{ success: boolean; message: string }> {
    if (!this.scriptUrl) {
      return { success: false, message: 'URL Web App Google Sheets kosong' };
    }
    try {
      const url = new URL(this.scriptUrl);
      url.searchParams.append('action', 'ping');
      const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
      const json = await res.json();
      return { success: json.success, message: json.message || 'Koneksi ke Google Sheets Berhasil!' };
    } catch (err: any) {
      return { success: false, message: `Gagal terhubung: ${err.message}` };
    }
  }

  async getInitialData(): Promise<InitialDataResponse> {
    try {
      const data = await this.callApi('getInitialData', null, 'GET');
      return data;
    } catch (err) {
      console.warn('Google Sheets unreachable, falling back to local store:', err);
      return this.localFallback.getInitialData();
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await this.callApi('getProducts', null, 'GET');
    } catch {
      return this.localFallback.getProducts();
    }
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const saved = await this.localFallback.saveProduct(product);
    await db.outboxQueue.add({
      action: 'saveProduct',
      payload: saved,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return saved;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const res = await this.localFallback.deleteProduct(id);
    await db.outboxQueue.add({
      action: 'deleteProduct',
      payload: { id },
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return res;
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await this.callApi('getCategories', null, 'GET');
    } catch {
      return this.localFallback.getCategories();
    }
  }

  async saveCategory(category: Partial<Category>): Promise<Category> {
    const saved = await this.localFallback.saveCategory(category);
    await db.outboxQueue.add({
      action: 'saveCategory',
      payload: saved,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return saved;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const res = await this.localFallback.deleteCategory(id);
    await db.outboxQueue.add({
      action: 'deleteCategory',
      payload: { id },
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return res;
  }

  async adjustStock(payload: { productId: string; newStock: number; reason: 'RUSAK' | 'HILANG' | 'KOREKSI_OPNAME' | 'SALAH_INPUT' | 'LAINNYA'; notes?: string }): Promise<{ success: boolean; newStock: number }> {
    const res = await this.localFallback.adjustStock(payload);
    await db.outboxQueue.add({
      action: 'adjustStock',
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return res;
  }

  async getStockMutations(productId?: string): Promise<StockMutation[]> {
    try {
      return await this.callApi('getStockMutations', { productId }, 'POST');
    } catch {
      return this.localFallback.getStockMutations(productId);
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await this.callApi('getSuppliers', null, 'GET');
    } catch {
      return this.localFallback.getSuppliers();
    }
  }

  async saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const saved = await this.localFallback.saveSupplier(supplier);
    await db.outboxQueue.add({
      action: 'saveSupplier',
      payload: saved,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return saved;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const res = await this.localFallback.deleteSupplier(id);
    await db.outboxQueue.add({
      action: 'deleteSupplier',
      payload: { id },
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return res;
  }

  async getPurchases(): Promise<Purchase[]> {
    try {
      return await this.callApi('getPurchases', null, 'GET');
    } catch {
      return this.localFallback.getPurchases();
    }
  }

  async createPurchase(payload: CreatePurchasePayload): Promise<{ purchaseNo: string; success: boolean }> {
    const localRes = await this.localFallback.createPurchase(payload);
    const fullPayload = { ...payload, purchaseNo: localRes.purchaseNo };
    await db.outboxQueue.add({
      action: 'createPurchase',
      payload: fullPayload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return localRes;
  }

  async checkoutSale(payload: CheckoutPayload): Promise<{ invoiceNo: string; success: boolean }> {
    // 1. Simpan ke IndexedDB lokal secara instan (UI kasir & struk langsung siap < 15ms)
    const localRes = await this.localFallback.checkoutSale(payload);
    const fullPayload = { ...payload, invoiceNo: localRes.invoiceNo };
    
    // 2. Masukkan ke antrean sinkronisasi latar belakang
    await db.outboxQueue.add({
      action: 'checkoutSale',
      payload: fullPayload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    
    // 3. Picu background sync secara non-blocking
    this.triggerBackgroundSync();
    
    return localRes;
  }

  async getSalesHistory(): Promise<Sale[]> {
    try {
      const res = await this.callApi('getSalesHistory', null, 'GET');
      return res.sales || [];
    } catch {
      return this.localFallback.getSalesHistory();
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      return await this.callApi('getCustomers', null, 'GET');
    } catch {
      return this.localFallback.getCustomers();
    }
  }

  async saveCustomer(customer: Partial<Customer>): Promise<Customer> {
    const saved = await this.localFallback.saveCustomer(customer);
    await db.outboxQueue.add({
      action: 'saveCustomer',
      payload: saved,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return saved;
  }

  async getReceivables(): Promise<Receivable[]> {
    try {
      return await this.callApi('getReceivables', null, 'GET');
    } catch {
      return this.localFallback.getReceivables();
    }
  }

  async payReceivable(payload: PayReceivablePayload): Promise<boolean> {
    const paymentId = payload.paymentId || `PAY-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullPayload = { ...payload, paymentId };
    await this.localFallback.payReceivable(fullPayload);
    await db.outboxQueue.add({
      action: 'payReceivable',
      payload: fullPayload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return true;
  }

  async getAccountingReport(): Promise<{ journal: JournalLine[]; coa: ChartOfAccount[] }> {
    try {
      return await this.callApi('getAccountingReport', null, 'GET');
    } catch {
      return this.localFallback.getAccountingReport();
    }
  }

  async createManualJournal(payload: CreateManualJournalPayload): Promise<boolean> {
    await this.localFallback.createManualJournal(payload);
    await db.outboxQueue.add({
      action: 'createManualJournal',
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return true;
  }

  async saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const saved = await this.localFallback.saveSettings(settings);
    await db.outboxQueue.add({
      action: 'saveSettings',
      payload: saved,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    this.triggerBackgroundSync();
    return saved;
  }
}
