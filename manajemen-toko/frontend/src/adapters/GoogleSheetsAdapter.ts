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
    try {
      const res = await this.callApi('saveProduct', product, 'POST');
      await this.localFallback.saveProduct(res);
      return res;
    } catch {
      return this.localFallback.saveProduct(product);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.callApi('deleteProduct', { id }, 'POST');
      await this.localFallback.deleteProduct(id);
      return true;
    } catch {
      return this.localFallback.deleteProduct(id);
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await this.callApi('getCategories', null, 'GET');
    } catch {
      return this.localFallback.getCategories();
    }
  }

  async saveCategory(category: Partial<Category>): Promise<Category> {
    try {
      const res = await this.callApi('saveCategory', category, 'POST');
      await this.localFallback.saveCategory(res);
      return res;
    } catch {
      return this.localFallback.saveCategory(category);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await this.callApi('deleteCategory', { id }, 'POST');
      await this.localFallback.deleteCategory(id);
      return true;
    } catch {
      return this.localFallback.deleteCategory(id);
    }
  }

  async adjustStock(payload: { productId: string; newStock: number; reason: 'RUSAK' | 'HILANG' | 'KOREKSI_OPNAME' | 'SALAH_INPUT' | 'LAINNYA'; notes?: string }): Promise<{ success: boolean; newStock: number }> {
    try {
      const res = await this.callApi('adjustStock', payload, 'POST');
      await this.localFallback.adjustStock(payload);
      return res;
    } catch {
      return this.localFallback.adjustStock(payload);
    }
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
    try {
      const res = await this.callApi('saveSupplier', supplier, 'POST');
      await this.localFallback.saveSupplier(res);
      return res;
    } catch {
      return this.localFallback.saveSupplier(supplier);
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      await this.callApi('deleteSupplier', { id }, 'POST');
      await this.localFallback.deleteSupplier(id);
      return true;
    } catch {
      return this.localFallback.deleteSupplier(id);
    }
  }

  async getPurchases(): Promise<Purchase[]> {
    try {
      return await this.callApi('getPurchases', null, 'GET');
    } catch {
      return this.localFallback.getPurchases();
    }
  }

  async createPurchase(payload: CreatePurchasePayload): Promise<{ purchaseNo: string; success: boolean }> {
    try {
      const res = await this.callApi('createPurchase', payload, 'POST');
      await this.localFallback.createPurchase(payload);
      return res;
    } catch {
      // Pada saat offline, simpan lokal dan masukkan ke antrean outbox untuk auto-sync
      const localRes = await this.localFallback.createPurchase(payload);
      await db.outboxQueue.add({
        action: 'createPurchase',
        payload: { ...payload, purchaseNo: localRes.purchaseNo },
        createdAt: new Date().toISOString(),
        retryCount: 0
      });
      return localRes;
    }
  }

  async checkoutSale(payload: CheckoutPayload): Promise<{ invoiceNo: string; success: boolean }> {
    try {
      const res = await this.callApi('checkoutSale', payload, 'POST');
      // Sync local cache as well
      await this.localFallback.checkoutSale(payload);
      return { invoiceNo: res.invoiceNo, success: true };
    } catch {
      // In offline scenario, commit locally dan daftarkan ke outboxQueue
      const localRes = await this.localFallback.checkoutSale(payload);
      await db.outboxQueue.add({
        action: 'checkoutSale',
        payload: { ...payload, invoiceNo: localRes.invoiceNo },
        createdAt: new Date().toISOString(),
        retryCount: 0
      });
      return localRes;
    }
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
    try {
      const res = await this.callApi('saveCustomer', customer, 'POST');
      await this.localFallback.saveCustomer(res);
      return res;
    } catch {
      return this.localFallback.saveCustomer(customer);
    }
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
    try {
      await this.callApi('payReceivable', fullPayload, 'POST');
      await this.localFallback.payReceivable(fullPayload);
      return true;
    } catch {
      await this.localFallback.payReceivable(fullPayload);
      await db.outboxQueue.add({
        action: 'payReceivable',
        payload: fullPayload,
        createdAt: new Date().toISOString(),
        retryCount: 0
      });
      return true;
    }
  }

  async getAccountingReport(): Promise<{ journal: JournalLine[]; coa: ChartOfAccount[] }> {
    try {
      return await this.callApi('getAccountingReport', null, 'GET');
    } catch {
      return this.localFallback.getAccountingReport();
    }
  }

  async createManualJournal(payload: CreateManualJournalPayload): Promise<boolean> {
    try {
      await this.callApi('createManualJournal', payload, 'POST');
      await this.localFallback.createManualJournal(payload);
      return true;
    } catch {
      await this.localFallback.createManualJournal(payload);
      await db.outboxQueue.add({
        action: 'createManualJournal',
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0
      });
      return true;
    }
  }

  async saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
      const res = await this.callApi('saveSettings', settings, 'POST');
      await this.localFallback.saveSettings(settings);
      return res;
    } catch {
      return this.localFallback.saveSettings(settings);
    }
  }
}
