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

export interface CheckoutPayload {
  invoiceNo?: string;
  customerName?: string;
  customerId?: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'CREDIT';
  cashReceived: number;
  changeAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  dueDate?: string;
  items: Array<{
    productId: string;
    productName: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
  }>;
}

export interface PayReceivablePayload {
  paymentId?: string;
  receivableId: string;
  amount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
  notes?: string;
}

export interface StockAdjustmentPayload {
  productId: string;
  newStock: number;
  reason: 'RUSAK' | 'HILANG' | 'KOREKSI_OPNAME' | 'SALAH_INPUT' | 'LAINNYA';
  notes?: string;
}

export interface CreateManualJournalPayload {
  description: string;
  referenceType?: string;
  referenceId?: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    notes?: string;
  }>;
}

export interface IDataProvider {
  name: string;
  ping(): Promise<{ success: boolean; message: string }>;
  getInitialData(): Promise<InitialDataResponse>;
  getProducts(): Promise<Product[]>;
  saveProduct(product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
  getCategories(): Promise<Category[]>;
  saveCategory(category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  adjustStock(payload: StockAdjustmentPayload): Promise<{ success: boolean; newStock: number }>;
  getStockMutations(productId?: string): Promise<StockMutation[]>;
  getSuppliers(): Promise<Supplier[]>;
  saveSupplier(supplier: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<boolean>;
  getPurchases(): Promise<Purchase[]>;
  createPurchase(payload: CreatePurchasePayload): Promise<{ purchaseNo: string; success: boolean }>;
  checkoutSale(payload: CheckoutPayload): Promise<{ invoiceNo: string; success: boolean }>;
  getSalesHistory(): Promise<Sale[]>;
  getCustomers(): Promise<Customer[]>;
  saveCustomer(customer: Partial<Customer>): Promise<Customer>;
  getReceivables(): Promise<Receivable[]>;
  payReceivable(payload: PayReceivablePayload): Promise<boolean>;
  getAccountingReport(): Promise<{ journal: JournalLine[]; coa: ChartOfAccount[] }>;
  createManualJournal(payload: CreateManualJournalPayload): Promise<boolean>;
  saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
}
