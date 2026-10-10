export type DataSourceMode = 'indexeddb' | 'google_sheets' | 'spring_boot';

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountHolder: string;
  qrisImageUrl: string;
  qrisString: string;
  dataSourceMode: DataSourceMode;
  googleSheetsUrl: string;
  springBootApiUrl: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  updatedAt: string;
}

export interface StockMutation {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  referenceNo: string;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentDebt: number;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  invoiceNo: string;
  productId: string;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'CREDIT';

export interface Sale {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerId?: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  changeAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  dueDate?: string;
  items: SaleItem[];
}

export interface Receivable {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE';
  createdAt: string;
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  invoiceNo: string;
  date: string;
  amount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
  notes: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'ASET' | 'KEWAJIBAN' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN_HPP' | 'BEBAN_OPERASIONAL';
  normalBalance: 'DEBIT' | 'KREDIT';
}

export interface JournalLine {
  id: string;
  entryNo: string;
  date: string;
  refType: string;
  refNo: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface InitialDataResponse {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  coa: ChartOfAccount[];
  suppliers?: Supplier[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  supplierId?: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
  paymentStatus: 'PAID' | 'UNPAID';
  dueDate?: string;
  notes?: string;
  items: PurchaseItem[];
}

export interface CreatePurchasePayload {
  purchaseNo?: string;
  supplierId?: string;
  supplierName: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
  paymentStatus: 'PAID' | 'UNPAID';
  dueDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
  }>;
}
