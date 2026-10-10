import type { IDataProvider, CheckoutPayload, PayReceivablePayload, CreateManualJournalPayload } from './IDataProvider';
import { IndexedDbAdapter } from './IndexedDbAdapter';
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

export class SpringBootAdapter implements IDataProvider {
  name = 'Spring Boot Backend (REST API + PostgreSQL)';
  private baseUrl: string;
  private localFallback: IndexedDbAdapter;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.localFallback = new IndexedDbAdapter();
    this.token = localStorage.getItem('tokoumkm_jwt');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('tokoumkm_jwt', token);
    else localStorage.removeItem('tokoumkm_jwt');
  }

  private async fetchApi(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }

  async ping(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/ping`);
      if (res.ok) {
        return { success: true, message: 'Backend Spring Boot aktif dan terhubung ke PostgreSQL!' };
      }
      return { success: false, message: `Backend merespons dengan status ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `Tidak dapat menghubungi Backend Spring Boot (${err.message}). Pastikan server di port 8080 berjalan.` };
    }
  }

  async getInitialData(): Promise<InitialDataResponse> {
    try {
      return await this.fetchApi('/api/v1/store/initial-data');
    } catch (err) {
      console.warn('Backend Spring Boot tidak merespons, beralih ke cache lokal:', err);
      return this.localFallback.getInitialData();
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await this.fetchApi('/api/v1/products');
    } catch {
      return this.localFallback.getProducts();
    }
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    try {
      const method = product.id ? 'PUT' : 'POST';
      const path = product.id ? `/api/v1/products/${product.id}` : '/api/v1/products';
      const res = await this.fetchApi(path, { method, body: JSON.stringify(product) });
      await this.localFallback.saveProduct(res);
      return res;
    } catch {
      return this.localFallback.saveProduct(product);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.fetchApi(`/api/v1/products/${id}`, { method: 'DELETE' });
      await this.localFallback.deleteProduct(id);
      return true;
    } catch {
      return this.localFallback.deleteProduct(id);
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await this.fetchApi('/api/v1/categories');
    } catch {
      return this.localFallback.getCategories();
    }
  }

  async saveCategory(category: Partial<Category>): Promise<Category> {
    try {
      const method = category.id ? 'PUT' : 'POST';
      const path = category.id ? `/api/v1/categories/${category.id}` : '/api/v1/categories';
      const res = await this.fetchApi(path, { method, body: JSON.stringify(category) });
      await this.localFallback.saveCategory(res);
      return res;
    } catch {
      return this.localFallback.saveCategory(category);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await this.fetchApi(`/api/v1/categories/${id}`, { method: 'DELETE' });
      await this.localFallback.deleteCategory(id);
      return true;
    } catch {
      return this.localFallback.deleteCategory(id);
    }
  }

  async adjustStock(payload: { productId: string; newStock: number; reason: 'RUSAK' | 'HILANG' | 'KOREKSI_OPNAME' | 'SALAH_INPUT' | 'LAINNYA'; notes?: string }): Promise<{ success: boolean; newStock: number }> {
    try {
      const res = await this.fetchApi('/api/v1/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await this.localFallback.adjustStock(payload);
      return res;
    } catch {
      return this.localFallback.adjustStock(payload);
    }
  }

  async getStockMutations(productId?: string): Promise<StockMutation[]> {
    try {
      const path = productId ? `/api/v1/inventory/mutations?productId=${productId}` : '/api/v1/inventory/mutations';
      return await this.fetchApi(path);
    } catch {
      return this.localFallback.getStockMutations(productId);
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await this.fetchApi('/api/v1/suppliers');
    } catch {
      return this.localFallback.getSuppliers();
    }
  }

  async saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const method = supplier.id ? 'PUT' : 'POST';
      const path = supplier.id ? `/api/v1/suppliers/${supplier.id}` : '/api/v1/suppliers';
      const res = await this.fetchApi(path, { method, body: JSON.stringify(supplier) });
      await this.localFallback.saveSupplier(res);
      return res;
    } catch {
      return this.localFallback.saveSupplier(supplier);
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      await this.fetchApi(`/api/v1/suppliers/${id}`, { method: 'DELETE' });
      await this.localFallback.deleteSupplier(id);
      return true;
    } catch {
      return this.localFallback.deleteSupplier(id);
    }
  }

  async getPurchases(): Promise<Purchase[]> {
    try {
      return await this.fetchApi('/api/v1/purchases');
    } catch {
      return this.localFallback.getPurchases();
    }
  }

  async createPurchase(payload: CreatePurchasePayload): Promise<{ purchaseNo: string; success: boolean }> {
    try {
      const res = await this.fetchApi('/api/v1/purchases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await this.localFallback.createPurchase(payload);
      return { purchaseNo: res.purchaseNo, success: true };
    } catch {
      return this.localFallback.createPurchase(payload);
    }
  }

  async checkoutSale(payload: CheckoutPayload): Promise<{ invoiceNo: string; success: boolean }> {
    try {
      const res = await this.fetchApi('/api/v1/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await this.localFallback.checkoutSale(payload);
      return { invoiceNo: res.invoiceNo, success: true };
    } catch {
      return this.localFallback.checkoutSale(payload);
    }
  }

  async getSalesHistory(): Promise<Sale[]> {
    try {
      return await this.fetchApi('/api/v1/sales');
    } catch {
      return this.localFallback.getSalesHistory();
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      return await this.fetchApi('/api/v1/customers');
    } catch {
      return this.localFallback.getCustomers();
    }
  }

  async saveCustomer(customer: Partial<Customer>): Promise<Customer> {
    try {
      const method = customer.id ? 'PUT' : 'POST';
      const path = customer.id ? `/api/v1/customers/${customer.id}` : '/api/v1/customers';
      const res = await this.fetchApi(path, { method, body: JSON.stringify(customer) });
      await this.localFallback.saveCustomer(res);
      return res;
    } catch {
      return this.localFallback.saveCustomer(customer);
    }
  }

  async getReceivables(): Promise<Receivable[]> {
    try {
      return await this.fetchApi('/api/v1/receivables');
    } catch {
      return this.localFallback.getReceivables();
    }
  }

  async payReceivable(payload: PayReceivablePayload): Promise<boolean> {
    try {
      await this.fetchApi(`/api/v1/receivables/${payload.receivableId}/pay`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await this.localFallback.payReceivable(payload);
      return true;
    } catch {
      return this.localFallback.payReceivable(payload);
    }
  }

  async getAccountingReport(): Promise<{ journal: JournalLine[]; coa: ChartOfAccount[] }> {
    try {
      return await this.fetchApi('/api/v1/accounting/report');
    } catch {
      return this.localFallback.getAccountingReport();
    }
  }

  async createManualJournal(payload: CreateManualJournalPayload): Promise<boolean> {
    try {
      await this.fetchApi('/api/v1/accounting/journal', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await this.localFallback.createManualJournal(payload);
      return true;
    } catch {
      return this.localFallback.createManualJournal(payload);
    }
  }

  async saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
      const res = await this.fetchApi('/api/v1/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      await this.localFallback.saveSettings(settings);
      return res;
    } catch {
      return this.localFallback.saveSettings(settings);
    }
  }
}
