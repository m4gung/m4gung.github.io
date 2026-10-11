import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { IndexedDbAdapter, DEFAULT_SETTINGS } from '../adapters/IndexedDbAdapter';
import { GoogleSheetsAdapter } from '../adapters/GoogleSheetsAdapter';
import { SpringBootAdapter } from '../adapters/SpringBootAdapter';

import { db } from '../db/indexedDb';

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE';

interface StoreContextType {
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
  testConnection: () => Promise<{ success: boolean; message: string }>;
  switchDataSourceMode: (mode: DataSourceMode, customUrl?: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [provider, setProvider] = useState<IDataProvider>(() => new IndexedDbAdapter());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('SYNCED');
  const [outboxCount, setOutboxCount] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pantau jumlah antrean outbox di IndexedDB
  const refreshOutboxCount = async () => {
    try {
      const count = await db.outboxQueue.count();
      setOutboxCount(count);
      if (!navigator.onLine) {
        setSyncStatus('OFFLINE');
      } else if (count > 0) {
        setSyncStatus('PENDING');
      } else {
        setSyncStatus('SYNCED');
      }
    } catch (e) {
      console.warn('Gagal membaca outbox count:', e);
    }
  };

  // Proses pengiriman antrean outbox ke cloud provider
  const syncOutboxQueue = async () => {
    if (!navigator.onLine) {
      setSyncStatus('OFFLINE');
      return;
    }

    const items = await db.outboxQueue.toArray();
    if (items.length === 0) {
      setSyncStatus('SYNCED');
      setOutboxCount(0);
      return;
    }

    setSyncStatus('SYNCING');
    for (const item of items) {
      try {
        if (item.action === 'checkoutSale') {
          await provider.checkoutSale(item.payload);
        } else if (item.action === 'createPurchase') {
          await provider.createPurchase(item.payload);
        } else if (item.action === 'payReceivable') {
          await provider.payReceivable(item.payload);
        } else if (item.action === 'createManualJournal') {
          await provider.createManualJournal(item.payload);
        }
        // Sukses disinkronkan, hapus dari outbox
        if (item.id) {
          await db.outboxQueue.delete(item.id);
        }
      } catch (err) {
        console.warn(`Gagal menyinkronkan outbox item ${item.id} (${item.action}):`, err);
        if (item.id) {
          await db.outboxQueue.update(item.id, { retryCount: (item.retryCount || 0) + 1 });
        }
      }
    }

    await refreshOutboxCount();
    await refreshData();
  };

  // Pantau status online/offline dan trigger auto-sync saat online kembali
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat auto-sync berkala tiap 30 detik jika ada pending queue
    const interval = setInterval(() => {
      if (navigator.onLine) {
        db.outboxQueue.count().then((count) => {
          setOutboxCount(count);
          if (count > 0) {
            syncOutboxQueue();
          }
        });
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [provider]);

  // Muat data outbox saat mount
  useEffect(() => {
    refreshOutboxCount();
  }, []);

  // Muat data awal
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    try {
      // Ambil pengaturan awal dari IndexedDB terlebih dahulu
      const localAdapter = new IndexedDbAdapter();
      const initial = await localAdapter.getInitialData();
      const currentSettings = initial.settings || DEFAULT_SETTINGS;
      setSettings(currentSettings);

      // Instansiasi adapter yang sesuai
      let activeAdapter: IDataProvider = localAdapter;
      if (currentSettings.dataSourceMode === 'google_sheets' && currentSettings.googleSheetsUrl) {
        activeAdapter = new GoogleSheetsAdapter(currentSettings.googleSheetsUrl);
      } else if (currentSettings.dataSourceMode === 'spring_boot') {
        activeAdapter = new SpringBootAdapter(currentSettings.springBootApiUrl);
      }
      setProvider(activeAdapter);

      // Muat data dari adapter aktif
      const appData = await activeAdapter.getInitialData();
      setProducts(appData.products || []);
      setCategories(appData.categories || []);
      setCustomers(appData.customers || []);
      setCoa(appData.coa || []);

      const supps = await activeAdapter.getSuppliers();
      setSuppliers(supps || []);

      const purchs = await activeAdapter.getPurchases();
      setPurchases(purchs || []);

      const recs = await activeAdapter.getReceivables();
      setReceivables(recs || []);
    } catch (err) {
      console.error('Error saat inisialisasi aplikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const data = await provider.getInitialData();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setCustomers(data.customers || []);
      setCoa(data.coa || []);

      const supps = await provider.getSuppliers();
      setSuppliers(supps || []);

      const purchs = await provider.getPurchases();
      setPurchases(purchs || []);

      const recs = await provider.getReceivables();
      setReceivables(recs || []);
    } catch (err) {
      console.error('Gagal memperbarui data:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = await provider.saveSettings(newSettings);
    // Selalu simpan juga ke IndexedDB lokal agar persist di browser
    const localAdapter = new IndexedDbAdapter();
    await localAdapter.saveSettings(newSettings);
    setSettings(updated);
  };

  const switchDataSourceMode = async (mode: DataSourceMode, customUrl?: string) => {
    let newAdapter: IDataProvider;
    const newSettings: Partial<StoreSettings> = { dataSourceMode: mode };

    if (mode === 'google_sheets') {
      const url = customUrl || settings.googleSheetsUrl;
      newSettings.googleSheetsUrl = url;
      newAdapter = new GoogleSheetsAdapter(url);
    } else if (mode === 'spring_boot') {
      const url = customUrl || settings.springBootApiUrl;
      newSettings.springBootApiUrl = url;
      newAdapter = new SpringBootAdapter(url);
    } else {
      newAdapter = new IndexedDbAdapter();
    }

    setProvider(newAdapter);
    await updateSettings(newSettings);
    await refreshData();
  };

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    return provider.ping();
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        provider,
        isOnline,
        syncStatus,
        outboxCount,
        syncOutboxQueue,
        products,
        categories,
        customers,
        suppliers,
        purchases,
        receivables,
        coa,
        loading,
        refreshData,
        testConnection,
        switchDataSourceMode
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore harus digunakan di dalam StoreProvider');
  }
  return context;
};
