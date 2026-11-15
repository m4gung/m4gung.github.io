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
  storeName: 'Toko UMKM',
  storePhone: '',
  storeAddress: '',
  bankName: '',
  bankAccountNo: '',
  bankAccountHolder: '',
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

export class IndexedDbAdapter implements IDataProvider {
  name = 'IndexedDB (Offline Local Store)';

  async ping(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'IndexedDB lokal aktif dan responsif' };
  }

  async initDefaultsIfEmpty(): Promise<void> {
    // Bersihkan data dummy peninggalan versi sebelumnya jika masih ada di browser
    const dummyProductIds = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006'];
    const dummyCustomerIds = ['CUST-001', 'CUST-002'];
    const dummySupplierIds = ['SUP-001', 'SUP-002'];
    const dummyReceivableIds = ['REC-INIT-001'];

    try {
      await db.products.bulkDelete(dummyProductIds);
      await db.customers.bulkDelete(dummyCustomerIds);
      await db.suppliers.bulkDelete(dummySupplierIds);
      await db.receivables.bulkDelete(dummyReceivableIds);

      // Perbarui jika pengaturan masih tersimpan nama toko dummy lama
      const currentSetting = await db.settings.get('main');
      if (currentSetting && currentSetting.value?.storeName === 'Toko Berkah Bersama') {
        await db.settings.put({
          key: 'main',
          value: {
            ...currentSetting.value,
            storeName: 'Toko UMKM',
            storePhone: '',
            storeAddress: '',
            bankName: '',
            bankAccountNo: '',
            bankAccountHolder: ''
          }
        });
      }
    } catch {
      // Abaikan bila tabel masih kosong
    }

    // Inisialisasi Bagan Akun Standar (SAK EMKM) jika belum ada
    const coaCount = await db.coa.count();
    if (coaCount === 0) {
      await db.coa.bulkAdd(DEFAULT_COA);
    }

    // Inisialisasi Pengaturan jika belum ada
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({ key: 'main', value: DEFAULT_SETTINGS });
    }
  }

  async clearAllData(): Promise<void> {
    await db.products.clear();
    await db.categories.clear();
    await db.customers.clear();
    await db.suppliers.clear();
    await db.sales.clear();
    await db.saleItems.clear();
    await db.purchases.clear();
    await db.purchaseItems.clear();
    await db.receivables.clear();
    await db.receivablePayments.clear();
    await db.stockMutations.clear();
    await db.journalLines.clear();
    await db.outboxQueue.clear();
    await db.settings.put({ key: 'main', value: DEFAULT_SETTINGS });

    const coaCount = await db.coa.count();
    if (coaCount === 0) {
      await db.coa.bulkAdd(DEFAULT_COA);
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

    let purchaseId = payload.id || `PUR-${Date.now()}`;
    let purchaseNo = payload.purchaseNo || `PO-${dateFormatted}-${randomSuffix}`;
    let existingDate = now;

    // Jika mode edit transaksi pembelian yang sudah ada, rollback stok lama & bersihkan catatan terkait
    if (payload.id) {
      const existing = await db.purchases.get(payload.id);
      if (existing) {
        purchaseNo = payload.purchaseNo || existing.purchaseNo;
        existingDate = existing.date || now;

        // Rollback stok lama
        if (existing.items && existing.items.length > 0) {
          for (const oldIt of existing.items) {
            const prod = await db.products.get(oldIt.productId);
            if (prod) {
              prod.stock = Math.max(0, prod.stock - Number(oldIt.quantity));
              prod.updatedAt = now;
              await db.products.put(prod);
            }
          }
        }

        // Hapus item detail, mutasi, dan jurnal lama terkait PO ini
        await db.purchaseItems.where('purchaseId').equals(payload.id).delete();
        await db.stockMutations.where('referenceNo').equals(existing.purchaseNo).delete();
        await db.journalLines.where('refNo').equals(existing.purchaseNo).delete();
      }
    }

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
        date: existingDate,
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
      date: existingDate,
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
      creditLimit: customer.creditLimit !== undefined ? Number(customer.creditLimit) : 0,
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

  /**
   * Edit Transaksi Penjualan secara atomik:
   * 1. Kembalikan stok lama, hapus item lama, piutang lama & jurnal lama
   * 2. Terapkan item baru, stok baru, piutang baru & jurnal baru dengan invoiceNo yang sama
   */
  async updateSale(invoiceNo: string, payload: CheckoutPayload): Promise<Sale> {
    const existing = await db.sales.get(invoiceNo);
    if (!existing) {
      throw new Error(`Transaksi ${invoiceNo} tidak ditemukan.`);
    }

    const now = new Date().toISOString();

    // 1. Revert stok lama
    for (const oldItem of existing.items || []) {
      const prod = await db.products.get(oldItem.productId);
      if (prod) {
        prod.stock += Number(oldItem.quantity);
        prod.updatedAt = now;
        await db.products.put(prod);
      }
    }

    // 2. Hapus saleItems, stockMutations, & journalLines lama terkait invoiceNo
    await db.saleItems.where('invoiceNo').equals(invoiceNo).delete();
    const oldMutations = await db.stockMutations.filter((m) => m.referenceNo === invoiceNo).toArray();
    if (oldMutations.length > 0) {
      await db.stockMutations.bulkDelete(oldMutations.map((m) => m.id));
    }
    const oldJournals = await db.journalLines.filter((j) => j.refNo === invoiceNo).toArray();
    if (oldJournals.length > 0) {
      await db.journalLines.bulkDelete(oldJournals.map((j) => j.id));
    }

    // 3. Revert piutang & currentDebt pelanggan lama jika ada
    const oldReceivables = await db.receivables.where('invoiceNo').equals(invoiceNo).toArray();
    for (const rec of oldReceivables) {
      if (rec.customerId) {
        const oldCust = await db.customers.get(rec.customerId);
        if (oldCust) {
          oldCust.currentDebt = Math.max(0, Number(oldCust.currentDebt) - Number(rec.remainingAmount));
          oldCust.updatedAt = now;
          await db.customers.put(oldCust);
        }
      }
      await db.receivables.delete(rec.id);
    }

    // 4. Terapkan item baru & mutasi stok baru
    let totalCost = 0;
    const itemsToSave: SaleItem[] = [];
    const mutationsToSave: StockMutation[] = [];

    for (const it of payload.items) {
      const subtotal = Number(it.sellingPrice) * Number(it.quantity);
      totalCost += Number(it.costPrice || 0) * Number(it.quantity);

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

      const prod = await db.products.get(it.productId);
      if (prod) {
        prod.stock -= Number(it.quantity);
        prod.updatedAt = now;
        await db.products.put(prod);
      }

      mutationsToSave.push({
        id: `MUT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: now,
        productId: it.productId,
        productName: it.productName,
        type: 'OUT_SALE',
        quantity: Number(it.quantity),
        referenceNo: invoiceNo,
        notes: 'Edit Penjualan Kasir'
      });
    }

    await db.saleItems.bulkAdd(itemsToSave);
    await db.stockMutations.bulkAdd(mutationsToSave);

    const updatedSale: Sale = {
      invoiceNo,
      date: payload.invoiceNo ? existing.date : existing.date,
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
    await db.sales.put(updatedSale);

    // 5. Catat piutang baru jika CREDIT / UNPAID
    if (payload.paymentMethod === 'CREDIT' || payload.paymentStatus === 'UNPAID') {
      const remainingAmount = payload.finalAmount - (payload.cashReceived || 0);
      await db.receivables.add({
        id: `REC-${Date.now()}`,
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

    // 6. Posting ulang jurnal double-entry
    const entryNo = `JRN-${invoiceNo}`;
    const journals: JournalLine[] = [];
    if (payload.paymentMethod === 'CASH') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '1101', accountName: 'Kas Toko', debit: payload.finalAmount, credit: 0, notes: 'Kas Penjualan (Edit)' },
        { id: `JL-${Date.now()}-2`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang (Edit)' }
      );
    } else if (payload.paymentMethod === 'QRIS' || payload.paymentMethod === 'TRANSFER') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '1102', accountName: 'Bank', debit: payload.finalAmount, credit: 0, notes: `Penerimaan ${payload.paymentMethod} (Edit)` },
        { id: `JL-${Date.now()}-2`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang (Edit)' }
      );
    } else if (payload.paymentMethod === 'CREDIT') {
      journals.push(
        { id: `JL-${Date.now()}-1`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '1103', accountName: 'Piutang Usaha', debit: payload.finalAmount, credit: 0, notes: 'Penjualan Kredit (Edit)' },
        { id: `JL-${Date.now()}-2`, entryNo, date: existing.date, refType: 'SALE', refNo: invoiceNo, accountCode: '4101', accountName: 'Pendapatan Penjualan', debit: 0, credit: payload.finalAmount, notes: 'Penjualan Barang (Edit)' }
      );
    }
    if (totalCost > 0) {
      journals.push(
        { id: `JL-${Date.now()}-3`, entryNo, date: existing.date, refType: 'COGS', refNo: invoiceNo, accountCode: '5101', accountName: 'Beban Pokok Penjualan (HPP)', debit: totalCost, credit: 0, notes: 'Pengakuan HPP (Edit)' },
        { id: `JL-${Date.now()}-4`, entryNo, date: existing.date, refType: 'COGS', refNo: invoiceNo, accountCode: '1201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: totalCost, notes: 'Pengurangan Stok (Edit)' }
      );
    }
    await db.journalLines.bulkAdd(journals);

    return updatedSale;
  }

  /** Ekspor seluruh tabel IndexedDB ke objek JSON siap backup */
  async exportAllData() {
    await this.initDefaultsIfEmpty();
    return {
      app: 'manajemen-toko-web',
      version: 1,
      exportedAt: new Date().toISOString(),
      tables: {
        settings: await db.settings.toArray(),
        categories: await db.categories.toArray(),
        products: await db.products.toArray(),
        stockMutations: await db.stockMutations.toArray(),
        customers: await db.customers.toArray(),
        suppliers: await db.suppliers.toArray(),
        purchases: await db.purchases.toArray(),
        purchaseItems: await db.purchaseItems.toArray(),
        sales: await db.sales.toArray(),
        saleItems: await db.saleItems.toArray(),
        receivables: await db.receivables.toArray(),
        receivablePayments: await db.receivablePayments.toArray(),
        coa: await db.coa.toArray(),
        journalLines: await db.journalLines.toArray(),
      },
    };
  }

  /** Import / pulihkan seluruh data toko dari file JSON backup secara atomik */
  async importAllData(backup: any): Promise<void> {
    if (!backup || typeof backup !== 'object' || !backup.tables || typeof backup.tables !== 'object') {
      throw new Error('Format file backup tidak valid (objek tables tidak ditemukan).');
    }

    const t = backup.tables;
    await db.transaction(
      'rw',
      [
        db.settings,
        db.categories,
        db.products,
        db.stockMutations,
        db.customers,
        db.suppliers,
        db.purchases,
        db.purchaseItems,
        db.sales,
        db.saleItems,
        db.receivables,
        db.receivablePayments,
        db.coa,
        db.journalLines,
      ],
      async () => {
        await Promise.all([
          db.settings.clear(),
          db.categories.clear(),
          db.products.clear(),
          db.stockMutations.clear(),
          db.customers.clear(),
          db.suppliers.clear(),
          db.purchases.clear(),
          db.purchaseItems.clear(),
          db.sales.clear(),
          db.saleItems.clear(),
          db.receivables.clear(),
          db.receivablePayments.clear(),
          db.coa.clear(),
          db.journalLines.clear(),
        ]);

        if (Array.isArray(t.settings) && t.settings.length) await db.settings.bulkPut(t.settings);
        if (Array.isArray(t.categories) && t.categories.length) await db.categories.bulkPut(t.categories);
        if (Array.isArray(t.products) && t.products.length) await db.products.bulkPut(t.products);
        if (Array.isArray(t.stockMutations) && t.stockMutations.length) await db.stockMutations.bulkPut(t.stockMutations);
        if (Array.isArray(t.customers) && t.customers.length) await db.customers.bulkPut(t.customers);
        if (Array.isArray(t.suppliers) && t.suppliers.length) await db.suppliers.bulkPut(t.suppliers);
        if (Array.isArray(t.purchases) && t.purchases.length) await db.purchases.bulkPut(t.purchases);
        if (Array.isArray(t.purchaseItems) && t.purchaseItems.length) await db.purchaseItems.bulkPut(t.purchaseItems);
        if (Array.isArray(t.sales) && t.sales.length) await db.sales.bulkPut(t.sales);
        if (Array.isArray(t.saleItems) && t.saleItems.length) await db.saleItems.bulkPut(t.saleItems);
        if (Array.isArray(t.receivables) && t.receivables.length) await db.receivables.bulkPut(t.receivables);
        if (Array.isArray(t.receivablePayments) && t.receivablePayments.length) await db.receivablePayments.bulkPut(t.receivablePayments);
        if (Array.isArray(t.coa) && t.coa.length) await db.coa.bulkPut(t.coa);
        if (Array.isArray(t.journalLines) && t.journalLines.length) await db.journalLines.bulkPut(t.journalLines);
      }
    );
  }
}
