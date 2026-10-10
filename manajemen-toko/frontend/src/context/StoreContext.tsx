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

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  provider: IDataProvider;
  isOnline: boolean;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pantau status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
