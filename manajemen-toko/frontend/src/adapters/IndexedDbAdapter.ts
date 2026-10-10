import type { IDataProvider, CheckoutPayload, PayReceivablePayload, CreateManualJournalPayload } from './IDataProvider';
import { db } from '../db/indexedDb';
import type { 
  Product, 
  Category,
  Customer, 
  Sale, 
  Receivable, 
  StoreSettings, 
  InitialDataResponse,
  JournalLine,
  ChartOfAccount,
  SaleItem,
  StockMutation,
  ReceivablePayment,
  Supplier,
  Purchase,
  PurchaseItem,
  CreatePurchasePayload
} from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Toko Berkah Bersama',
  storePhone: '081234567890',
  storeAddress: 'Jl. Trans Sulawesi No. 12, Kolaka',
  bankName: 'BCA',
  bankAccountNo: '1234567890',
  bankAccountHolder: 'Agung Maulana',
  qrisImageUrl: '',
  qrisString: '',
  dataSourceMode: 'indexeddb',
  googleSheetsUrl: '',
  springBootApiUrl: 'http://localhost:8080'
};

const DEFAULT_COA: ChartOfAccount[] = [
  { code: '1101', name: 'Kas Toko', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1102', name: 'Bank', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1103', name: 'Piutang Usaha', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1201', name: 'Persediaan Barang Dagang', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '2101', name: 'Utang Usaha', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
  { code: '3101', name: 'Modal Pemilik', type: 'EKUITAS', normalBalance: 'KREDIT' },
  { code: '3201', name: 'Laba Ditahan', type: 'EKUITAS', normalBalance: 'KREDIT' },
  { code: '4101', name: 'Pendapatan Penjualan', type: 'PENDAPATAN', normalBalance: 'KREDIT' },
  { code: '5101', name: 'Beban Pokok Penjualan (HPP)', type: 'BEBAN_HPP', normalBalance: 'DEBIT' },
  { code: '6101', name: 'Beban Operasional Toko', type: 'BEBAN_OPERASIONAL', normalBalance: 'DEBIT' },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'PRD-001', sku: 'MIE-001', barcode: '89910011001', name: 'Indomie Goreng Original', category: 'Makanan', unit: 'Bks', costPrice: 2800, sellingPrice: 3500, stock: 120, minStock: 20, updatedAt: new Date().toISOString() },
  { id: 'PRD-002', sku: 'MIE-002', barcode: '89910011002', name: 'Indomie Kuah Ayam Bawang', category: 'Makanan', unit: 'Bks', costPrice: 2700, sellingPrice: 3500, stock: 85, minStock: 15, updatedAt: new Date().toISOString() },
  { id: 'PRD-003', sku: 'MNM-001', barcode: '89920021001', name: 'Le Minerale 600ml', category: 'Minuman', unit: 'Btl', costPrice: 2500, sellingPrice: 3500, stock: 48, minStock: 12, updatedAt: new Date().toISOString() },
  { id: 'PRD-004', sku: 'MNM-002', barcode: '89920021002', name: 'Teh Botol Sosro Kotak 250ml', category: 'Minuman', unit: 'Kotak', costPrice: 3200, sellingPrice: 4500, stock: 36, minStock: 10, updatedAt: new Date().toISOString() },
  { id: 'PRD-005', sku: 'MB-001', barcode: '89930031001', name: 'Minyak Goreng Bimoli 1L', category: 'Sembako', unit: 'Pouch', costPrice: 17500, sellingPrice: 20000, stock: 24, minStock: 6, updatedAt: new Date().toISOString() },
  { id: 'PRD-006', sku: 'SB-001', barcode: '89940041001', name: 'Sabun Mandi Lifebuoy 85g', category: 'Kebersihan', unit: 'Pcs', costPrice: 3800, sellingPrice: 5000, stock: 50, minStock: 10, updatedAt: new Date().toISOString() }
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'Bu Warung Hj. Maryam', phone: '081244556677', address: 'Jl. Poros No. 5', creditLimit: 2000000, currentDebt: 350000, updatedAt: new Date().toISOString() },
  { id: 'CUST-002', name: 'Pak RT Syamsul', phone: '081399887766', address: 'Blok B No. 14', creditLimit: 1000000, currentDebt: 0, updatedAt: new Date().toISOString() }
];

const SEED_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'PT Sumber Pangan Makmur', phone: '081122334455', address: 'Kawasan Industri Pergudangan No. 8', isActive: true, createdAt: new Date().toISOString() },
  { id: 'SUP-002', name: 'CV Berkah Retail Utama', phone: '081299887711', address: 'Jl. Niaga Sentra Blok C-2', isActive: true, createdAt: new Date().toISOString() }
];

export class IndexedDbAdapter implements IDataProvider {
  name = 'IndexedDB (Offline Local Store)';

  async ping(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'IndexedDB lokal aktif dan responsif' };
  }

  async initDefaultsIfEmpty(): Promise<void> {
    const productCount = await db.products.count();
    if (productCount === 0) {
      await db.products.bulkAdd(SEED_PRODUCTS);
      await db.categories.bulkAdd([
        { id: 'CAT-1', name: 'Sembako', createdAt: new Date().toISOString() },
        { id: 'CAT-2', name: 'Makanan', createdAt: new Date().toISOString() },
        { id: 'CAT-3', name: 'Minuman', createdAt: new Date().toISOString() },
        { id: 'CAT-4', name: 'Kebersihan', createdAt: new Date().toISOString() }
      ]);
      await db.customers.bulkAdd(SEED_CUSTOMERS);
      await db.suppliers.bulkAdd(SEED_SUPPLIERS);
      await db.coa.bulkAdd(DEFAULT_COA);

      // Default initial receivable for Bu Hj. Maryam
      await db.receivables.add({
        id: 'REC-INIT-001',
        invoiceNo: 'INV-20261001001',
        customerId: 'CUST-001',
        customerName: 'Bu Warung Hj. Maryam',
        totalAmount: 350000,
        paidAmount: 0,
        remainingAmount: 350000,
        dueDate: '2026-10-25',
        status: 'ACTIVE',
        createdAt: '2026-10-01T10:00:00.000Z'
      });
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({ key: 'main', value: DEFAULT_SETTINGS });
    }
  }

  async getInitialData(): Promise<InitialDataResponse> {
    await this.initDefaultsIfEmpty();
    const settingsItem = await db.settings.get('main');
    const settings = settingsItem ? settingsItem.value : DEFAULT_SETTINGS;
    const categories = await db.categories.toArray();
    const products = await db.products.toArray();
    const customers = await db.customers.toArray();
    const coa = await db.coa.toArray();

    return { settings, categories, products, customers, coa };
  }

  async getProducts(): Promise<Product[]> {
    await this.initDefaultsIfEmpty();
    return db.products.toArray();
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    await this.initDefaultsIfEmpty();
    const now = new Date().toISOString();
    const id = product.id || `PRD-${Date.now().toString(36).toUpperCase()}`;
    const fullProduct: Product = {
      id,
      sku: product.sku || '',
      barcode: product.barcode || '',
      name: product.name || 'Produk Tanpa Nama',
      category: product.category || 'Umum',
      unit: product.unit || 'Pcs',
      costPrice: Number(product.costPrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      stock: Number(product.stock || 0),
      minStock: Number(product.minStock || 5),
      updatedAt: now
    };
    await db.products.put(fullProduct);
    return fullProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.products.delete(id);
    return true;
  }

  async getCategories(): Promise<Category[]> {
    await this.initDefaultsIfEmpty();
    return db.categories.toArray();
  }

  async saveCategory(category: Partial<Category>): Promise<Category> {
    await this.initDefaultsIfEmpty();
    const id = category.id || `CAT-${Date.now().toString(36).toUpperCase()}`;
    const fullCat: Category = {
      id,
      name: category.name || 'Kategori Baru',
      createdAt: category.createdAt || new Date().toISOString()
    };
    await db.categories.put(fullCat);
    return fullCat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.categories.delete(id);
    return true;
  }

  async adjustStock(payload: { productId: string; newStock: number; reason: 'RUSAK' | 'HILANG' | 'KOREKSI_OPNAME' | 'SALAH_INPUT' | 'LAINNYA'; notes?: string }): Promise<{ success: boolean; newStock: number }> {
    const prod = await db.products.get(payload.productId);
    if (!prod) {
      throw new Error('Produk tidak ditemukan');
    }

    if (payload.newStock < 0) {
      throw new Error('Stok barang tidak boleh bernilai negatif');
    }

    const currentStock = prod.stock;
    const diff = payload.newStock - currentStock;
    const now = new Date().toISOString();

    prod.stock = payload.newStock;
    prod.updatedAt = now;
    await db.products.put(prod);

    // Rekam mutasi stok
    const mutation: StockMutation = {
      id: `MUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: now,
      productId: prod.id,
      productName: prod.name,
      type: 'ADJUSTMENT',
      quantity: diff,
      referenceNo: `ADJ-${payload.reason}`,
      notes: `${payload.reason}: ${payload.notes || 'Penyesuaian stok opname'}`
    };
    await db.stockMutations.add(mutation);

    // Auto-journaling jika terjadi selisih stok (kerugian rusak/hilang atau penambahan)
    const totalDiffVal = Math.abs(diff) * prod.costPrice;
    if (totalDiffVal > 0) {
      const entryNo = `JRN-ADJ-${prod.id}-${Date.now().toString().slice(-4)}`;
      if (diff < 0) {
        // Debet Beban Operasional / Selisih Stok, Kredit Persediaan
        await db.journalLines.bulkAdd([
          { id: `JLA-${Date.now()}-1`, entryNo, date: now, refType: 'ADJUSTMENT', refNo: prod.id, accountCode: '6101', accountName: 'Beban Operasional Toko', debit: totalDiffVal, credit: 0, notes: `Penyesuaian stok berkurang (${payload.reason}) ${prod.name}` },
          { id: `JLA-${Date.now()}-2`, entryNo, date: now, refType: 'ADJUSTMENT', refNo: prod.id, accountCode: '1201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: totalDiffVal, notes: `Penurunan nilai persediaan ${prod.name}` }
        ]);
      } else {
        // Debet Persediaan, Kredit Pendapatan Lain-lain / Modal
        await db.journalLines.bulkAdd([
          { id: `JLA-${Date.now()}-1`, entryNo, date: now, refType: 'ADJUSTMENT', refNo: prod.id, accountCode: '1201', accountName: 'Persediaan Barang Dagang', debit: totalDiffVal, credit: 0, notes: `Penambahan nilai persediaan ${prod.name}` },
          { id: `JLA-${Date.now()}-2`, entryNo, date: now, refType: 'ADJUSTMENT', refNo: prod.id, accountCode: '3201', accountName: 'Laba Ditahan', debit: 0, credit: totalDiffVal, notes: `Penyesuaian stok bertambah ${prod.name}` }
        ]);
      }
    }

    return { success: true, newStock: payload.newStock };
  }

  async getStockMutations(productId?: string): Promise<StockMutation[]> {
    await this.initDefaultsIfEmpty();
    if (productId) {
      return db.stockMutations.where('productId').equals(productId).reverse().sortBy('date');
    }
    return db.stockMutations.reverse().sortBy('date');
  }

  async getSuppliers(): Promise<Supplier[]> {
    await this.initDefaultsIfEmpty();
    return db.suppliers.toArray();
  }

  async saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    await this.initDefaultsIfEmpty();
    const id = supplier.id || `SUP-${Date.now().toString(36).toUpperCase()}`;
    const fullSupplier: Supplier = {
      id,
      name: supplier.name || 'Supplier Baru',
      phone: supplier.phone || '',
      address: supplier.address || '',
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      createdAt: supplier.createdAt || new Date().toISOString()
    };
    await db.suppliers.put(fullSupplier);
    return fullSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    await db.suppliers.delete(id);
    return true;
  }

  async getPurchases(): Promise<Purchase[]> {
    await this.initDefaultsIfEmpty();
    return db.purchases.reverse().toArray();
  }

  async createPurchase(payload: CreatePurchasePayload): Promise<{ purchaseNo: string; success: boolean }> {
    await this.initDefaultsIfEmpty();
    const now = new Date().toISOString();
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const purchaseNo = payload.purchaseNo || `PO-${dateFormatted}-${randomSuffix}`;
    const purchaseId = `PUR-${Date.now()}`;

    let totalAmount = 0;
    const itemsToSave: PurchaseItem[] = [];
    const mutationsToSave: StockMutation[] = [];

    // 1. Tambah stok barang dan catat detail
    for (const it of payload.items) {
      const subtotal = Number(it.costPrice) * Number(it.quantity);
      totalAmount += subtotal;

      itemsToSave.push({
        id: `PITM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        purchaseId,
        productId: it.productId,
        productName: it.productName,
        quantity: Number(it.quantity),
        costPrice: Number(it.costPrice),
        subtotal
      });

      // Update stok produk & harga modal terbaru
      const prod = await db.products.get(it.productId);
      if (prod) {
        prod.stock += Number(it.quantity);
        if (Number(it.costPrice) > 0) {
          prod.costPrice = Number(it.costPrice);
        }
        prod.updatedAt = now;
        await db.products.put(prod);
      }

      // Catat mutasi stok masuk (IN_PURCHASE)
      mutationsToSave.push({
        id: `MUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: now,
        productId: it.productId,
        productName: it.productName,
        type: 'IN_PURCHASE',
        quantity: Number(it.quantity),
        referenceNo: purchaseNo,
        notes: `Pengadaan barang dari ${payload.supplierName}`
      });
    }

    await db.purchaseItems.bulkAdd(itemsToSave);
    await db.stockMutations.bulkAdd(mutationsToSave);

    // 2. Simpan Header Pembelian
    const purchase: Purchase = {
      id: purchaseId,
      purchaseNo,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      date: now,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      dueDate: payload.dueDate,
      notes: payload.notes,
      items: itemsToSave
    };
    await db.purchases.put(purchase);

    // 3. Auto-journaling Akuntansi Double-Entry untuk Pembelian
    const entryNo = `JRN-${purchaseNo}`;
    const creditAccount = payload.paymentMethod === 'CASH' ? '1101' : (payload.paymentMethod === 'TRANSFER' ? '1102' : '2101');
    const creditName = payload.paymentMethod === 'CASH' ? 'Kas Toko' : (payload.paymentMethod === 'TRANSFER' ? 'Bank' : 'Utang Usaha');

    await db.journalLines.bulkAdd([
      { id: `JLP-${Date.now()}-1`, entryNo, date: now, refType: 'PURCHASE', refNo: purchaseNo, accountCode: '1201', accountName: 'Persediaan Barang Dagang', debit: totalAmount, credit: 0, notes: `Pengadaan barang dari ${payload.supplierName}` },
      { id: `JLP-${Date.now()}-2`, entryNo, date: now, refType: 'PURCHASE', refNo: purchaseNo, accountCode: creditAccount, accountName: creditName, debit: 0, credit: totalAmount, notes: `Pembayaran/Utang Pembelian ${purchaseNo}` }
    ]);

    return { purchaseNo, success: true };
  }

  async checkoutSale(payload: CheckoutPayload): Promise<{ invoiceNo: string; success: boolean }> {
    await this.initDefaultsIfEmpty();
    const now = new Date().toISOString();
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = payload.invoiceNo || `INV-${dateFormatted}-${randomSuffix}`;

    let totalCost = 0;
    const itemsToSave: SaleItem[] = [];
    const mutationsToSave: StockMutation[] = [];

    // 1. Process items and update stock
    for (const it of payload.items) {
      const subtotal = Number(it.sellingPrice) * Number(it.quantity);
      const itemCost = Number(it.costPrice || 0) * Number(it.quantity);
      totalCost += itemCost;

      itemsToSave.push({
        id: `SITM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        invoiceNo,
        productId: it.productId,
        productName: it.productName,
        costPrice: Number(it.costPrice || 0),
        sellingPrice: Number(it.sellingPrice),
        quantity: Number(it.quantity),
        subtotal
      });

      // Update product stock in IndexedDB
      const prod = await db.products.get(it.productId);
      if (prod) {
        prod.stock -= Number(it.quantity);
        prod.updatedAt = now;
        await db.products.put(prod);
      }

      // Record stock mutation
      mutationsToSave.push({
        id: `MUT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: now,
        productId: it.productId,
        productName: it.productName,
        type: 'OUT_SALE',
        quantity: Number(it.quantity),
        referenceNo: invoiceNo,
        notes: 'Penjualan Kasir POS'
      });
    }

    await db.saleItems.bulkAdd(itemsToSave);
    await db.stockMutations.bulkAdd(mutationsToSave);

    // 2. Save Sale Header
    const sale: Sale = {
      invoiceNo,
      date: now,
      customerName: payload.customerName || 'Pelanggan Umum',
      customerId: payload.customerId,
      totalAmount: payload.totalAmount,
      discount: payload.discount,
      finalAmount: payload.finalAmount,
      paymentMethod: payload.paymentMethod,
      cashReceived: payload.cashReceived,
      changeAmount: payload.changeAmount,
      paymentStatus: payload.paymentStatus,
      notes: payload.notes,
      dueDate: payload.dueDate,
      items: itemsToSave
    };
    await db.sales.put(sale);

    // 3. Handle Receivables if CREDIT or UNPAID
    if (payload.paymentMethod === 'CREDIT' || payload.paymentStatus === 'UNPAID') {
      const remainingAmount = payload.finalAmount - (payload.cashReceived || 0);
      const recId = `REC-${Date.now()}`;
      await db.receivables.add({
        id: recId,
        invoiceNo,
        customerId: payload.customerId || 'CUST-001',
        customerName: payload.customerName || 'Pelanggan',
        totalAmount: payload.finalAmount,
        paidAmount: payload.cashReceived || 0,
        remainingAmount,
        dueDate: payload.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: 'ACTIVE',
        createdAt: now
      });

      if (payload.customerId) {
        const cust = await db.customers.get(payload.customerId);
        if (cust) {
          cust.currentDebt += remainingAmount;
          cust.updatedAt = now;
          await db.customers.put(cust);
        }
      }
    }

    // 4. Double-Entry Auto-Journaling
    const entryNo = `JRN-${invoiceNo}`;
    const journals: JournalLine[] = [];

    if (payload.paymentMethod === 'CASH') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '1101', accountName: 'Kas Toko', debit: payload.finalAmount, credit: 0, notes: 'Kas Penjualan' },
        { id: `JL-${Date.now()}-2`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang' }
      );
    } else if (payload.paymentMethod === 'QRIS' || payload.paymentMethod === 'TRANSFER') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '1102', accountName: 'Bank', debit: payload.finalAmount, credit: 0, notes: `Penerimaan ${payload.paymentMethod}` },
        { id: `JL-${Date.now()}-2`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang' }
      );
    } else if (payload.paymentMethod === 'CREDIT') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '1103', accountName: 'Piutang Usaha', debit: payload.finalAmount, credit: 0, notes: 'Penjualan Kredit' },
        { id: `JL-${Date.now()}-2`, entryNo, date: now, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang' }
      );
    }

    // HPP Jurnal
    if (totalCost > 0) {
      journals.push(
        { id: `JL-${Date.now()}-3`, entryNo, date: now, refType: 'COGS', refNo: invoiceNo, accountCode: '5101', accountName: 'Beban Pokok Penjualan (HPP)', debit: totalCost, credit: 0, notes: 'Pengakuan HPP' },
        { id: `JL-${Date.now()}-4`, entryNo, date: now, refType: 'COGS', refNo: invoiceNo, accountCode: '1201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: totalCost, notes: 'Pengurangan Stok' }
      );
    }

    await db.journalLines.bulkAdd(journals);

    return { invoiceNo, success: true };
  }

  async getSalesHistory(): Promise<Sale[]> {
    return db.sales.reverse().toArray();
  }

  async getCustomers(): Promise<Customer[]> {
    await this.initDefaultsIfEmpty();
    return db.customers.toArray();
  }

  async saveCustomer(customer: Partial<Customer>): Promise<Customer> {
    await this.initDefaultsIfEmpty();
    const now = new Date().toISOString();
    const id = customer.id || `CUST-${Date.now().toString(36).toUpperCase()}`;
    const fullCustomer: Customer = {
      id,
      name: customer.name || 'Pelanggan Baru',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: Number(customer.creditLimit || 5000000),
      currentDebt: Number(customer.currentDebt || 0),
      updatedAt: now
    };
    await db.customers.put(fullCustomer);
    return fullCustomer;
  }

  async getReceivables(): Promise<Receivable[]> {
    await this.initDefaultsIfEmpty();
    return db.receivables.toArray();
  }

  async payReceivable(payload: PayReceivablePayload): Promise<boolean> {
    const rec = await db.receivables.get(payload.receivableId);
    if (!rec) return false;

    const now = new Date().toISOString();
    const newPaid = Number(rec.paidAmount) + Number(payload.amount);
    const newRemaining = Math.max(0, Number(rec.totalAmount) - newPaid);

    rec.paidAmount = newPaid;
    rec.remainingAmount = newRemaining;
    if (newRemaining <= 0) {
      rec.status = 'PAID';
    }
    await db.receivables.put(rec);

    const payment: ReceivablePayment = {
      id: `PAY-${Date.now()}`,
      receivableId: payload.receivableId,
      invoiceNo: rec.invoiceNo,
      date: now,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      notes: payload.notes || 'Cicilan Piutang'
    };
    await db.receivablePayments.add(payment);

    // Reduce customer debt
    if (rec.customerId) {
      const cust = await db.customers.get(rec.customerId);
      if (cust) {
        cust.currentDebt = Math.max(0, cust.currentDebt - payload.amount);
        cust.updatedAt = now;
        await db.customers.put(cust);
      }
    }

    // Auto-journaling for receivable payment
    const debitAccount = (payload.paymentMethod === 'TRANSFER' || payload.paymentMethod === 'QRIS') ? '1102' : '1101';
    const debitName = (payload.paymentMethod === 'TRANSFER' || payload.paymentMethod === 'QRIS') ? 'Bank' : 'Kas Toko';
    await db.journalLines.bulkAdd([
      { id: `JLP-${Date.now()}-1`, entryNo: `JRN-PAY-${rec.id}`, date: now, refType: 'PAYMENT', refNo: rec.invoiceNo, accountCode: debitAccount, accountName: debitName, debit: payload.amount, credit: 0, notes: `Pelunasan Piutang ${rec.invoiceNo}` },
      { id: `JLP-${Date.now()}-2`, entryNo: `JRN-PAY-${rec.id}`, date: now, refType: 'PAYMENT', refNo: rec.invoiceNo, accountCode: '1103', accountName: 'Piutang Usaha', debit: 0, credit: payload.amount, notes: `Pengurangan Piutang ${rec.invoiceNo}` }
    ]);

    return true;
  }

  async getAccountingReport(): Promise<{ journal: JournalLine[]; coa: ChartOfAccount[] }> {
    await this.initDefaultsIfEmpty();
    const journal = await db.journalLines.reverse().toArray();
    const coa = await db.coa.toArray();
    return { journal, coa };
  }

  async createManualJournal(payload: CreateManualJournalPayload): Promise<boolean> {
    await this.initDefaultsIfEmpty();
    const now = new Date().toISOString();
    const entryNo = `JRN-${Date.now().toString(36).toUpperCase()}`;

    // Ambil info nama akun
    const coaList = await db.coa.toArray();
    const coaMap = new Map(coaList.map(c => [c.code, c.name]));

    const linesToInsert: JournalLine[] = payload.lines.map((l, idx) => ({
      id: `JL-${Date.now()}-${idx}`,
      entryNo,
      date: now,
      refType: payload.referenceType || 'MANUAL',
      refNo: payload.referenceId || entryNo,
      accountCode: l.accountCode,
      accountName: coaMap.get(l.accountCode) || `Akun ${l.accountCode}`,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      notes: l.notes || payload.description || 'Jurnal Manual'
    }));

    await db.journalLines.bulkAdd(linesToInsert);
    return true;
  }

  async saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const currentItem = await db.settings.get('main');
    const merged = { ...(currentItem ? currentItem.value : DEFAULT_SETTINGS), ...settings };
    await db.settings.put({ key: 'main', value: merged });
    return merged;
  }
}
