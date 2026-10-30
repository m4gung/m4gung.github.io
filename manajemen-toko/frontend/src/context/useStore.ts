import { createContext, useContext } from 'react';
import type { 
  StoreSettings, 
  Product, 
  Customer, 
  Receivable, 
  Category, 
  ChartOfAccount,
  DataSourceMode,
  Supplier,
  Purchase
} from '../types';
import type { IDataProvider } from '../adapters/IDataProvider';

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE';

export interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  provider: IDataProvider;
  isOnline: boolean;
  syncStatus: SyncStatus;
  outboxCount: number;
  syncOutboxQueue: () => Promise<void>;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  receivables: Receivable[];
  coa: ChartOfAccount[];
  loading: boolean;
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  switchDataSourceMode: (mode: DataSourceMode, customUrl?: string) => Promise<void>;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore harus digunakan di dalam StoreProvider');
  }
  return context;
};
