import Dexie, { type Table } from 'dexie';
import type {
  Branch,
  ServiceItem,
  ProductItem,
  Barber,
  Customer,
  Attendance,
  StaffAllowance,
  Transaction,
  Expense,
  ShopSettings,
  SyncOutboxItem
} from '../types';

export class BarbershopDatabase extends Dexie {
  branches!: Table<Branch, string>;
  services!: Table<ServiceItem, string>;
  products!: Table<ProductItem, string>;
  barbers!: Table<Barber, string>;
  customers!: Table<Customer, string>;
  attendances!: Table<Attendance, string>;
  staffAllowances!: Table<StaffAllowance, string>;
  transactions!: Table<Transaction, string>;
  expenses!: Table<Expense, string>;
  settings!: Table<ShopSettings, string>;
  syncOutbox!: Table<SyncOutboxItem, string>;

  constructor() {
    super('BarbershopDatabase');
    this.version(2).stores({
      branches: 'id, code, name, isActive',
      services: 'id, name, category, isActive',
      products: 'id, branchId, sku, name, category, stock, isActive',
      barbers: 'id, branchId, name, phone, isActive',
      customers: 'id, name, phone, totalVisits',
      attendances: 'id, branchId, barberId, date, status, isSynced',
      staffAllowances: 'id, barberId, date, type',
      transactions: 'id, branchId, invoiceNumber, customerPhone, status, isSynced, createdAt',
      expenses: 'id, branchId, date, category',
      settings: 'id',
      syncOutbox: 'id, entityType, action, status, createdAt'
    });
  }
}

export const db = new BarbershopDatabase();

export async function seedInitialDataIfEmpty() {
  const branchCount = await db.branches.count();
  if (branchCount === 0) {
    await db.branches.bulkPut([
      {
        id: 'brn-1',
        code: 'CB-01',
        name: 'Cabang Utama (Pettarani)',
        address: 'Jl. A. P. Pettarani No. 88, Makassar',
        phone: '0812-3456-7890',
        managerName: 'Mas Budi',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: 'brn-2',
        code: 'CB-02',
        name: 'Cabang Panakkukang',
        address: 'Jl. Pengayoman Ruko No. 12, Panakkukang, Makassar',
        phone: '0812-9876-5432',
        managerName: 'Andi Fadli',
        isActive: true,
        createdAt: '2024-06-01'
      }
    ]);
  }

  const serviceCount = await db.services.count();
  if (serviceCount > 0) return;

  // Initial Default Settings
  await db.settings.put({
    id: 'default',
    shopName: 'Gentlemen Classic Barbershop',
    phone: '0812-3456-7890',
    address: 'Jl. Ahmad Yani No. 88, Makassar',
    receiptFooter: 'Terima kasih atas kunjungan Anda! Stay Sharp, Stay Handsome.',
    storageMode: 'GOOGLE_SHEETS',
    googleAppsScriptUrl: '',
    springBootApiUrl: 'http://localhost:8080/api/v1',
    defaultCommissionType: 'PERCENTAGE',
    defaultCommissionValue: 35, // 35%
    defaultDailyMealAllowance: 20000, // Rp 20.000 / hari hadir
    autoMealAllowanceOnAttendance: true,
    activeBranchId: 'brn-1',
    currency: 'IDR',
    timezone: 'Asia/Makassar'
  });

  // Initial Services
  await db.services.bulkPut([
    {
      id: 'srv-1',
      name: 'Gentleman Haircut (Cuci + Potong + Styling)',
      category: 'Haircut',
      price: 50000,
      durationMinutes: 45,
      isActive: true
    },
    {
      id: 'srv-2',
      name: 'Kids Haircut',
      category: 'Haircut',
      price: 40000,
      durationMinutes: 30,
      isActive: true
    },
    {
      id: 'srv-3',
      name: 'Traditional Shaving & Hot Towel',
      category: 'Shaving',
      price: 35000,
      durationMinutes: 30,
      isActive: true
    },
    {
      id: 'srv-4',
      name: 'Hair Coloring (Hitam Alami)',
      category: 'Coloring',
      price: 85000,
      durationMinutes: 60,
      isActive: true
    },
    {
      id: 'srv-5',
      name: 'Head Massage & Hair Wash',
      category: 'Treatment',
      price: 30000,
      durationMinutes: 20,
      isActive: true
    }
  ]);

  // Initial Retail Products (Pomade, Clay, Tonic)
  await db.products.bulkPut([
    {
      id: 'prd-1',
      sku: 'POM-01',
      name: 'Classic Pomade Oil-Based (Strong Hold)',
      category: 'Styling',
      costPrice: 40000,
      sellingPrice: 65000,
      stock: 15,
      minStockAlert: 3,
      isActive: true
    },
    {
      id: 'prd-2',
      sku: 'POM-02',
      name: 'Water-Based Pomade (Medium Shine)',
      category: 'Styling',
      costPrice: 45000,
      sellingPrice: 70000,
      stock: 12,
      minStockAlert: 3,
      isActive: true
    },
    {
      id: 'prd-3',
      sku: 'CLY-01',
      name: 'Matte Clay Natural Look',
      category: 'Styling',
      costPrice: 50000,
      sellingPrice: 80000,
      stock: 8,
      minStockAlert: 2,
      isActive: true
    },
    {
      id: 'prd-4',
      sku: 'TNC-01',
      name: 'Menthol Hair Tonic Fresh 100ml',
      category: 'Care',
      costPrice: 30000,
      sellingPrice: 50000,
      stock: 10,
      minStockAlert: 3,
      isActive: true
    }
  ]);

  // Initial Barbers
  await db.barbers.bulkPut([
    {
      id: 'brb-1',
      name: 'Mas Budi (Senior Barber)',
      phone: '081234567801',
      commissionType: 'DEFAULT',
      commissionValue: 0,
      dailyMealAllowance: 0,
      isActive: true,
      joinDate: '2024-01-10'
    },
    {
      id: 'brb-2',
      name: 'Andi Fadli (Fade Specialist)',
      phone: '081234567802',
      commissionType: 'DEFAULT',
      commissionValue: 0,
      dailyMealAllowance: 0,
      isActive: true,
      joinDate: '2024-03-15'
    },
    {
      id: 'brb-3',
      name: 'Rahmat Hidayat',
      phone: '081234567803',
      commissionType: 'DEFAULT',
      commissionValue: 0,
      dailyMealAllowance: 0,
      isActive: true,
      joinDate: '2024-05-01'
    }
  ]);

  // Initial Sample Customer
  await db.customers.bulkPut([
    {
      id: 'cst-1',
      name: 'Bpk. Hendra Wijaya',
      phone: '081345678910',
      haircutNotes: 'Undercut rapi samping 1.5 cm, jangan potong poni terlalu pendek',
      totalVisits: 3,
      totalSpent: 180000,
      lastVisitAt: '2026-10-05',
      createdAt: '2026-08-01'
    }
  ]);
}
