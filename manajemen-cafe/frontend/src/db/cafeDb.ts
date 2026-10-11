import Dexie, { type Table } from 'dexie';

export interface LocalOutlet {
  id: number;
  tenantId: number;
  name: string;
  address?: string;
  phone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  isActive: boolean;
}

export interface LocalCategory {
  id: number;
  outletId?: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LocalProduct {
  id: number;
  outletId?: number;
  categoryId?: number;
  name: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  isActive: boolean;
}

export interface LocalVariant {
  id: number;
  productId: number;
  name: string;
  priceAdjustment: number;
}

export interface LocalModifier {
  id: number;
  name: string;
  price: number;
}

export interface LocalTable {
  id: number;
  outletId: number;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export interface LocalOrder {
  id?: number;
  syncId: string;
  outletId: number;
  orderNumber: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'DEBIT';
  amountPaid: number;
  changeAmount: number;
  status: 'PENDING' | 'PAID' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  items: Array<{
    productId?: number;
    productName: string;
    variantName?: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    modifiers?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
  createdAt: string;
  isSynced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  clientSyncId: string;
  entityType: 'ORDER' | 'PAYMENT' | 'EXPENSE' | 'MENU';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
  errorMessage?: string;
}

export interface LocalIngredient {
  id: number;
  name: string;
  unit: string;
  costPerUnit: number;
  minimumStock: number;
  currentStock: number;
  isActive: boolean;
}

export interface LocalRecipe {
  id: number;
  productId: number;
  notes?: string;
  items: Array<{
    ingredientId: number;
    quantity: number;
  }>;
}

export interface LocalStockMovement {
  id?: number;
  ingredientId: number;
  ingredientName: string;
  movementType: string;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface LocalSupplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface LocalPurchaseItem {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface LocalPurchase {
  id?: number;
  outletId: number;
  supplierId?: number;
  supplierName?: string;
  invoiceNumber: string;
  purchaseDate: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
  status: 'RECEIVED' | 'DRAFT' | 'CANCELLED';
  notes?: string;
  items: LocalPurchaseItem[];
  createdAt: string;
}

export interface LocalExpense {
  id?: number;
  outletId: number;
  category: string; // UTILITY, SALARY, RENT, MAINTENANCE, MARKETING, SUPPLIES, OTHER
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  expenseDate: string;
  receiptRef?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface AppSettingItem {
  key: string;
  value: any;
}

export interface LocalAuditLog {
  id?: number;
  userId?: number;
  username: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export class CafeDatabase extends Dexie {
  outlets!: Table<LocalOutlet, number>;
  categories!: Table<LocalCategory, number>;
  products!: Table<LocalProduct, number>;
  productVariants!: Table<LocalVariant, number>;
  modifiers!: Table<LocalModifier, number>;
  diningTables!: Table<LocalTable, number>;
  orders!: Table<LocalOrder, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  appSettings!: Table<AppSettingItem, string>;
  ingredients!: Table<LocalIngredient, number>;
  recipes!: Table<LocalRecipe, number>;
  stockMovements!: Table<LocalStockMovement, number>;
  suppliers!: Table<LocalSupplier, number>;
  purchases!: Table<LocalPurchase, number>;
  expenses!: Table<LocalExpense, number>;
  auditLogs!: Table<LocalAuditLog, number>;

  constructor() {
    super('CafeFlowLocalDB');
    this.version(1).stores({
      outlets: 'id, tenantId, name, isActive',
      categories: 'id, outletId, name, sortOrder',
      products: 'id, outletId, categoryId, name, code, isActive',
      productVariants: 'id, productId, name',
      modifiers: 'id, name',
      diningTables: 'id, outletId, tableNumber, status',
      orders: '++id, syncId, outletId, orderNumber, status, createdAt, isSynced',
      syncQueue: '++id, clientSyncId, entityType, status, createdAt',
      appSettings: 'key',
      ingredients: 'id, name, isActive',
      recipes: 'id, productId',
      stockMovements: '++id, ingredientId, movementType, createdAt'
    });
    this.version(2).stores({
      suppliers: 'id, name, isActive',
      purchases: '++id, outletId, supplierId, invoiceNumber, purchaseDate, paymentStatus, status',
      expenses: '++id, outletId, category, expenseDate'
    });
    this.version(3).stores({
      auditLogs: '++id, action, entityType, createdAt'
    });
  }
}

export const db = new CafeDatabase();

export async function logLocalAudit(action: string, entityType: string, entityId: string, details: string, username = 'Kasir / Admin') {
  try {
    await db.auditLogs.add({
      username,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write local audit log:', err);
  }
}

// Initial Seeding jika DB lokal masih kosong
export async function seedInitialLocalDataIfEmpty() {
  const count = await db.products.count();
  if (count === 0) {
    // 1. Initial Outlet
    await db.outlets.put({
      id: 1,
      tenantId: 1,
      name: 'Cabang Utama (Pusat)',
      address: 'Jl. Kopi Harapan No. 42',
      phone: '081234567890',
      receiptHeader: 'Selamat Menikmati Kopi & Santapan Anda',
      receiptFooter: 'Terima kasih atas kunjungan Anda! Silakan datang kembali.',
      taxPercentage: 10,
      serviceChargePercentage: 5,
      isActive: true
    });

    // 2. Initial Categories
    await db.categories.bulkPut([
      { id: 1, outletId: 1, name: 'Coffee (Espresso Based)', sortOrder: 1, isActive: true },
      { id: 2, outletId: 1, name: 'Non-Coffee', sortOrder: 2, isActive: true },
      { id: 3, outletId: 1, name: 'Tea & Tisane', sortOrder: 3, isActive: true },
      { id: 4, outletId: 1, name: 'Pastry & Snacks', sortOrder: 4, isActive: true },
    ]);

    // 3. Initial Products
    await db.products.bulkPut([
      { id: 1, outletId: 1, categoryId: 1, name: 'Kopi Susu Gula Aren', code: 'KPS-01', basePrice: 20000, isActive: true },
      { id: 2, outletId: 1, categoryId: 1, name: 'Americano', code: 'AME-01', basePrice: 18000, isActive: true },
      { id: 3, outletId: 1, categoryId: 1, name: 'Cafe Latte', code: 'LAT-01', basePrice: 24000, isActive: true },
      { id: 4, outletId: 1, categoryId: 1, name: 'Caramel Macchiato', code: 'MAC-01', basePrice: 28000, isActive: true },
      { id: 5, outletId: 1, categoryId: 2, name: 'Matcha Latte', code: 'MTC-01', basePrice: 26000, isActive: true },
      { id: 6, outletId: 1, categoryId: 2, name: 'Chocolate Classic', code: 'CHO-01', basePrice: 24000, isActive: true },
      { id: 7, outletId: 1, categoryId: 3, name: 'Earl Grey Milk Tea', code: 'TEA-01', basePrice: 22000, isActive: true },
      { id: 8, outletId: 1, categoryId: 4, name: 'Butter Croissant', code: 'PAS-01', basePrice: 20000, isActive: true },
      { id: 9, outletId: 1, categoryId: 4, name: 'Kentang Goreng (French Fries)', code: 'SNK-01', basePrice: 18000, isActive: true },
    ]);

    // 4. Initial Tables
    await db.diningTables.bulkPut([
      { id: 1, outletId: 1, tableNumber: 'Meja 01', capacity: 2, status: 'AVAILABLE' },
      { id: 2, outletId: 1, tableNumber: 'Meja 02', capacity: 4, status: 'AVAILABLE' },
      { id: 3, outletId: 1, tableNumber: 'Meja 03', capacity: 4, status: 'AVAILABLE' },
      { id: 4, outletId: 1, tableNumber: 'Meja 04', capacity: 6, status: 'AVAILABLE' },
      { id: 5, outletId: 1, tableNumber: 'VIP 1', capacity: 8, status: 'AVAILABLE' },
    ]);

    // 5. Default App Settings
    await db.appSettings.put({ key: 'cafeName', value: 'CafeFlow Nusantara' });
    await db.appSettings.put({ key: 'activeOutletId', value: 1 });
    await db.appSettings.put({ key: 'backendMode', value: 'SPRING_BOOT' }); // 'SPRING_BOOT' | 'APPS_SCRIPT' | 'DUAL'
    await db.appSettings.put({ key: 'gasUrl', value: '' });
    await db.appSettings.put({ key: 'springBootUrl', value: 'http://localhost:8080/api' });
    await db.appSettings.put({
      key: 'printerConfig',
      value: {
        type: 'BROWSER', // 'BLUETOOTH' | 'USB' | 'BROWSER'
        paperWidth: 58,  // 58 or 80
        autoCut: true,
        deviceName: ''
      }
    });
  }

  // 6. Initial Ingredients & Recipes if empty
  const ingredientCount = await db.ingredients.count();
  if (ingredientCount === 0) {
    await db.ingredients.bulkPut([
      { id: 1, name: 'Biji Kopi Espresso Blend', unit: 'gram', costPerUnit: 250, minimumStock: 1000, currentStock: 5000, isActive: true },
      { id: 2, name: 'Susu Fresh Milk (Pasteurisasi)', unit: 'ml', costPerUnit: 20, minimumStock: 2500, currentStock: 12000, isActive: true },
      { id: 3, name: 'Gula Aren Cair Organik', unit: 'ml', costPerUnit: 35, minimumStock: 800, currentStock: 4000, isActive: true },
      { id: 4, name: 'Matcha Powder Premium Uji', unit: 'gram', costPerUnit: 600, minimumStock: 250, currentStock: 1200, isActive: true },
      { id: 5, name: 'Bubuk Cokelat Murni (Cocoa)', unit: 'gram', costPerUnit: 300, minimumStock: 500, currentStock: 2500, isActive: true },
      { id: 6, name: 'Sirup Karamel Gourmet', unit: 'ml', costPerUnit: 55, minimumStock: 400, currentStock: 2000, isActive: true },
      { id: 7, name: 'Earl Grey Tea Bag', unit: 'pcs', costPerUnit: 2500, minimumStock: 30, currentStock: 120, isActive: true },
      { id: 8, name: 'Cup & Lid Takeaway 16oz', unit: 'pcs', costPerUnit: 1200, minimumStock: 100, currentStock: 600, isActive: true }
    ]);

    await db.recipes.bulkPut([
      {
        id: 1,
        productId: 1, // Kopi Susu Gula Aren
        notes: 'Resep Signature Kopi Susu Gula Aren',
        items: [
          { ingredientId: 1, quantity: 18 },  // 18g espresso beans
          { ingredientId: 2, quantity: 120 }, // 120ml milk
          { ingredientId: 3, quantity: 25 },  // 25ml gula aren
          { ingredientId: 8, quantity: 1 }    // 1 cup
        ]
      },
      {
        id: 2,
        productId: 2, // Americano
        notes: 'Double Shot Espresso + Air Mineral Dingin',
        items: [
          { ingredientId: 1, quantity: 18 },
          { ingredientId: 8, quantity: 1 }
        ]
      },
      {
        id: 3,
        productId: 3, // Cafe Latte
        notes: 'Espresso + Steamed Milk',
        items: [
          { ingredientId: 1, quantity: 18 },
          { ingredientId: 2, quantity: 150 },
          { ingredientId: 8, quantity: 1 }
        ]
      },
      {
        id: 4,
        productId: 4, // Caramel Macchiato
        notes: 'Latte dengan sirup karamel artisanal',
        items: [
          { ingredientId: 1, quantity: 18 },
          { ingredientId: 2, quantity: 130 },
          { ingredientId: 6, quantity: 20 },
          { ingredientId: 8, quantity: 1 }
        ]
      },
      {
        id: 5,
        productId: 5, // Matcha Latte
        notes: 'Pure Uji Matcha whisked with steamed fresh milk',
        items: [
          { ingredientId: 4, quantity: 15 },
          { ingredientId: 2, quantity: 150 },
          { ingredientId: 8, quantity: 1 }
        ]
      },
      {
        id: 6,
        productId: 6, // Chocolate Classic
        notes: 'Rich chocolate drink',
        items: [
          { ingredientId: 5, quantity: 25 },
          { ingredientId: 2, quantity: 140 },
          { ingredientId: 8, quantity: 1 }
        ]
      },
      {
        id: 7,
        productId: 7, // Earl Grey Milk Tea
        notes: 'Cold brew earl grey steeped with milk',
        items: [
          { ingredientId: 7, quantity: 1 },
          { ingredientId: 2, quantity: 100 },
          { ingredientId: 3, quantity: 20 },
          { ingredientId: 8, quantity: 1 }
        ]
      }
    ]);

    // Initial stock movements log
    const now = new Date().toISOString();
    await db.stockMovements.bulkPut([
      { ingredientId: 1, ingredientName: 'Biji Kopi Espresso Blend', movementType: 'IN', quantityChange: 5000, stockBefore: 0, stockAfter: 5000, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 2, ingredientName: 'Susu Fresh Milk (Pasteurisasi)', movementType: 'IN', quantityChange: 12000, stockBefore: 0, stockAfter: 12000, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 3, ingredientName: 'Gula Aren Cair Organik', movementType: 'IN', quantityChange: 4000, stockBefore: 0, stockAfter: 4000, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 4, ingredientName: 'Matcha Powder Premium Uji', movementType: 'IN', quantityChange: 1200, stockBefore: 0, stockAfter: 1200, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 5, ingredientName: 'Bubuk Cokelat Murni (Cocoa)', movementType: 'IN', quantityChange: 2500, stockBefore: 0, stockAfter: 2500, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 6, ingredientName: 'Sirup Karamel Gourmet', movementType: 'IN', quantityChange: 2000, stockBefore: 0, stockAfter: 2000, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 7, ingredientName: 'Earl Grey Tea Bag', movementType: 'IN', quantityChange: 120, stockBefore: 0, stockAfter: 120, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now },
      { ingredientId: 8, ingredientName: 'Cup & Lid Takeaway 16oz', movementType: 'IN', quantityChange: 600, stockBefore: 0, stockAfter: 600, referenceId: 'INIT-STOCK', notes: 'Saldo awal gudang', createdAt: now }
    ]);
  }

  // 7. Initial Suppliers if empty
  const supplierCount = await db.suppliers.count();
  if (supplierCount === 0) {
    await db.suppliers.bulkPut([
      {
        id: 1,
        name: 'PT Kopi Roastery Nusantara',
        contactPerson: 'Budi Santoso',
        phone: '081298765432',
        email: 'sales@kopinusantara.id',
        address: 'Jl. Industri Roasting No. 12, Bandung',
        isActive: true
      },
      {
        id: 2,
        name: 'CV Fresh Farm Dairy',
        contactPerson: 'Dewi Lestari',
        phone: '081345678901',
        email: 'order@freshdairy.co.id',
        address: 'Kawasan Peternakan Lembang No. 8',
        isActive: true
      },
      {
        id: 3,
        name: 'Sentra Kemasan & Eco Packaging',
        contactPerson: 'Hendra Gunawan',
        phone: '082155667788',
        email: 'info@ecopack.id',
        address: 'Sentra Pergudangan Daan Mogot Blok C-4',
        isActive: true
      }
    ]);
  }

  // 8. Initial Expenses if empty
  const expenseCount = await db.expenses.count();
  if (expenseCount === 0) {
    const today = new Date().toISOString();
    await db.expenses.bulkPut([
      {
        outletId: 1,
        category: 'UTILITY',
        description: 'Tagihan Listrik PLN Operasional Cafe',
        amount: 850000,
        paymentMethod: 'TRANSFER',
        expenseDate: today,
        receiptRef: 'PLN-998231',
        recordedBy: 'Owner',
        createdAt: today
      },
      {
        outletId: 1,
        category: 'UTILITY',
        description: 'Internet WiFi Dedicated 100Mbps',
        amount: 450000,
        paymentMethod: 'TRANSFER',
        expenseDate: today,
        receiptRef: 'INDIHOME-4819',
        recordedBy: 'Owner',
        createdAt: today
      },
      {
        outletId: 1,
        category: 'SUPPLIES',
        description: 'Bahan Pembersih Bar & Sabun Cuci Sanitasi',
        amount: 125000,
        paymentMethod: 'CASH',
        expenseDate: today,
        receiptRef: 'NOTA-0482',
        recordedBy: 'Barista Lead',
        createdAt: today
      }
    ]);
  }

  // 9. Initial Audit Logs if empty
  const auditCount = await db.auditLogs.count();
  if (auditCount === 0) {
    const today = new Date().toISOString();
    await db.auditLogs.bulkPut([
      {
        username: 'System Admin',
        action: 'SYSTEM_INIT',
        entityType: 'SYSTEM',
        entityId: 'SYS-01',
        details: 'Inisialisasi sistem CafeFlow PWA Offline Database',
        createdAt: today
      },
      {
        username: 'Manager Pusat',
        action: 'PRICE_UPDATE',
        entityType: 'PRODUCT',
        entityId: 'PRD-01',
        details: 'Penyesuaian base price Kopi Susu Gula Aren ke Rp 22.000',
        createdAt: today
      },
      {
        username: 'Supervisor Bar',
        action: 'STOCK_ADJUST',
        entityType: 'INGREDIENT',
        entityId: 'ING-01',
        details: 'Kalibrasi grinder: penyesuaian stok biji kopi House Blend -50g',
        createdAt: today
      }
    ]);
  }
}

/**
 * Deduct stock locally when an order is completed/paid offline or online
 */
export async function deductStockForLocalOrder(order: LocalOrder): Promise<void> {
  try {
    for (const item of order.items) {
      if (!item.productId) continue;
      const recipe = await db.recipes.where('productId').equals(item.productId).first();
      if (recipe && recipe.items && recipe.items.length > 0) {
        for (const rItem of recipe.items) {
          const ingredient = await db.ingredients.get(rItem.ingredientId);
          if (ingredient) {
            const qtyNeeded = rItem.quantity * item.quantity;
            const stockBefore = ingredient.currentStock;
            const stockAfter = Number((stockBefore - qtyNeeded).toFixed(2));
            await db.ingredients.update(ingredient.id, { currentStock: stockAfter });
            await db.stockMovements.add({
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              movementType: 'SALE',
              quantityChange: -qtyNeeded,
              stockBefore: stockBefore,
              stockAfter: stockAfter,
              referenceId: order.orderNumber,
              notes: `POS Auto-Deduct Order #${order.orderNumber} (${item.quantity}x ${item.productName})`,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error auto-deducting stock for local order:', err);
  }
}

/**
 * Process a purchase locally: save purchase record, increase stock, and add audit movement
 */
export async function processLocalPurchase(purchase: LocalPurchase): Promise<void> {
  try {
    await db.purchases.add(purchase);
    if (purchase.status === 'RECEIVED') {
      for (const item of purchase.items) {
        const ingredient = await db.ingredients.get(item.ingredientId);
        if (ingredient) {
          const stockBefore = ingredient.currentStock;
          const stockAfter = Number((stockBefore + item.quantity).toFixed(2));
          await db.ingredients.update(ingredient.id, {
            currentStock: stockAfter,
            costPerUnit: item.unitCost
          });
          await db.stockMovements.add({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            movementType: 'PURCHASE',
            quantityChange: item.quantity,
            stockBefore,
            stockAfter,
            referenceId: purchase.invoiceNumber,
            notes: `Faktur Pembelian #${purchase.invoiceNumber} (${purchase.supplierName || 'Supplier'})`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.error('Error processing local purchase:', err);
  }
}
