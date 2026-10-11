export type StorageMode = 'GOOGLE_SHEETS' | 'SPRING_BOOT' | 'HYBRID';

export interface ShopSettings {
  id?: string;
  shopName: string;
  phone: string;
  address: string;
  receiptFooter: string;
  storageMode: StorageMode;
  googleAppsScriptUrl: string;
  springBootApiUrl: string;
  defaultCommissionType: 'PERCENTAGE' | 'FIXED';
  defaultCommissionValue: number; // Misal 35 (%) atau 15000 (Rp)
  defaultDailyMealAllowance: number; // Misal 20000 (Rp)
  autoMealAllowanceOnAttendance: boolean;
  currency: string;
  timezone: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;    // Harga Modal / HPP
  sellingPrice: number; // Harga Jual
  stock: number;        // Sisa Stok
  minStockAlert: number;// Batas Peringatan Stok Sedikit
  isActive: boolean;
  updatedAt?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  commissionType: 'DEFAULT' | 'PERCENTAGE' | 'FIXED';
  commissionValue: number; // 0 jika ikuti default
  dailyMealAllowance: number; // 0 jika ikuti default
  isActive: boolean;
  joinDate?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  haircutNotes: string; // Misal: "Taper fade, poni samping"
  totalVisits: number;
  totalSpent: number;
  lastVisitAt?: string;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT';

export interface Attendance {
  id: string;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  mealAllowanceGranted: boolean;
  notes?: string;
  isSynced?: boolean;
  createdAt: string;
}

export interface StaffAllowance {
  id: string;
  barberId: string;
  barberName: string;
  date: string;
  type: 'MEAL_ALLOWANCE' | 'TARGET_BONUS' | 'ATTENDANCE_BONUS' | 'TIPS' | 'OTHER' | 'KASBON';
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface TransactionCartItem {
  id: string;
  type: 'SERVICE' | 'PRODUCT';
  referenceId: string; // Service ID or Product ID
  name: string;
  price: number;
  costPrice: number; // 0 for service
  quantity: number;
  barberId?: string;
  barberName?: string;
  commissionTypeSnapshot?: string;
  commissionValueSnapshot?: number;
  calculatedCommission?: number;
  subtotal: number;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  cashierName: string;
  items: TransactionCartItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string;
  createdAt: string;
  isSynced?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface SyncOutboxItem {
  id: string;
  entityType: 'TRANSACTION' | 'ATTENDANCE' | 'PRODUCT_STOCK' | 'CUSTOMER' | 'EXPENSE' | 'SETTINGS';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SUCCESS';
  retryCount: number;
  lastErrorMessage?: string;
  createdAt: string;
  syncedAt?: string;
}
