import Dexie, { type Table } from 'dexie';
import type { 
  Product, 
  Category, 
  Customer, 
  Sale, 
  SaleItem, 
  Receivable, 
  ReceivablePayment, 
  StockMutation, 
  JournalLine, 
  ChartOfAccount,
  Supplier,
  Purchase,
  PurchaseItem
} from '../types';

export interface OutboxItem {
  id?: number;
  action: string;
  payload: any;
  createdAt: string;
  retryCount: number;
}

export interface SettingItem {
  key: string;
  value: any;
}

export class TokoDatabase extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  customers!: Table<Customer, string>;
  suppliers!: Table<Supplier, string>;
  sales!: Table<Sale, string>;
  saleItems!: Table<SaleItem, string>;
  purchases!: Table<Purchase, string>;
  purchaseItems!: Table<PurchaseItem, string>;
  receivables!: Table<Receivable, string>;
  receivablePayments!: Table<ReceivablePayment, string>;
  stockMutations!: Table<StockMutation, string>;
  journalLines!: Table<JournalLine, string>;
  coa!: Table<ChartOfAccount, string>;
  settings!: Table<SettingItem, string>;
  outboxQueue!: Table<OutboxItem, number>;

  constructor() {
    super('TokoUmkmDatabase');
    this.version(2).stores({
      products: 'id, sku, barcode, name, category, stock',
      categories: 'id, name',
      customers: 'id, name, phone',
      suppliers: 'id, name, phone',
      sales: 'invoiceNo, date, customerName, paymentMethod, paymentStatus',
      saleItems: 'id, invoiceNo, productId',
      purchases: 'id, purchaseNo, supplierId, date, paymentStatus',
      purchaseItems: 'id, purchaseId, productId',
      receivables: 'id, invoiceNo, customerId, status, dueDate',
      receivablePayments: 'id, receivableId, invoiceNo, date',
      stockMutations: 'id, productId, date, type',
      journalLines: 'id, entryNo, date, accountCode',
      coa: 'code, name, type',
      settings: 'key',
      outboxQueue: '++id, action, createdAt'
    });
  }
}

export const db = new TokoDatabase();
