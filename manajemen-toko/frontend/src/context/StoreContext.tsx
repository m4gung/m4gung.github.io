import React, { useState, useEffect, useRef } from 'react';
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
import { StoreContext, type SyncStatus } from './useStore';

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
  const isSyncingRef = useRef<boolean>(false);

  // Pantau jumlah antrean outbox di IndexedDB
  const refreshOutboxCount = async () => {
    try {
      const count = await db.outboxQueue.count();
      setOutboxCount(count);
      if (!navigator.onLine) {
        setSyncStatus('OFFLINE');
      } else if (count > 0) {
        // Jika sedang berjalan sinkronisasi, pertahankan SYNCING
        setSyncStatus(prev => prev === 'SYNCING' ? 'SYNCING' : 'PENDING');
      } else {
        setSyncStatus('SYNCED');
      }
    } catch (e) {
      console.warn('Gagal membaca outbox count:', e);
    }
  };

  // Proses pengiriman antrean outbox ke cloud provider secara berurutan (FIFO)
  const syncOutboxQueue = async () => {
    if (isSyncingRef.current) return;
    if (!navigator.onLine) {
      setSyncStatus('OFFLINE');
      return;
    }

    isSyncingRef.current = true;
    try {
      const items = await db.outboxQueue.toArray();
      if (items.length === 0) {
        setSyncStatus('SYNCED');
        setOutboxCount(0);
        return;
      }

      setSyncStatus('SYNCING');
      for (const item of items) {
        try {
          if (provider.executeCloudAction) {
            await provider.executeCloudAction(item.action, item.payload);
          } else {
            // Fallback jika adapter tidak memiliki executeCloudAction
            if (item.action === 'checkoutSale') {
              await provider.checkoutSale(item.payload);
            } else if (item.action === 'createPurchase') {
              await provider.createPurchase(item.payload);
            } else if (item.action === 'payReceivable') {
              await provider.payReceivable(item.payload);
            } else if (item.action === 'createManualJournal') {
              await provider.createManualJournal(item.payload);
            } else if (item.action === 'saveProduct') {
              await provider.saveProduct(item.payload);
            } else if (item.action === 'deleteProduct') {
              await provider.deleteProduct(item.payload.id);
            } else if (item.action === 'saveCategory') {
              await provider.saveCategory(item.payload);
            } else if (item.action === 'deleteCategory') {
              await provider.deleteCategory(item.payload.id);
            } else if (item.action === 'adjustStock') {
              await provider.adjustStock(item.payload);
            } else if (item.action === 'saveCustomer') {
              await provider.saveCustomer(item.payload);
            } else if (item.action === 'saveSupplier') {
              await provider.saveSupplier(item.payload);
            } else if (item.action === 'deleteSupplier') {
              await provider.deleteSupplier(item.payload.id);
            } else if (item.action === 'saveSettings') {
              await provider.saveSettings(item.payload);
            }
          }

          // Sukses disinkronkan ke cloud, hapus dari outbox
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
    } finally {
      isSyncingRef.current = false;
      await refreshOutboxCount();
    }
  };

  // Pantau status online/offline dan trigger auto-sync saat online kembali atau event outbox
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
    };

    // Event listener saat ada penambahan outbox baru secara background
    const handleTriggerSync = () => {
      refreshOutboxCount();
      if (navigator.onLine) {
        syncOutboxQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('toko:trigger-outbox-sync', handleTriggerSync);

    // Heartbeat auto-sync berkala tiap 25 detik jika ada pending queue
    const interval = setInterval(() => {
      if (navigator.onLine) {
        db.outboxQueue.count().then((count) => {
          setOutboxCount(count);
          if (count > 0) {
            syncOutboxQueue();
          }
        });
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('toko:trigger-outbox-sync', handleTriggerSync);
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
      // 1. Render data lokal IndexedDB terlebih dahulu secara instan (Stale-While-Revalidate)
      const localAdapter = new IndexedDbAdapter();
      const localInitial = await localAdapter.getInitialData();
      const currentSettings = localInitial.settings || DEFAULT_SETTINGS;
      setSettings(currentSettings);
      
      setProducts(localInitial.products || []);
      setCategories(localInitial.categories || []);
      setCustomers(localInitial.customers || []);
      setCoa(localInitial.coa || []);

      const [supps, purchs, recs] = await Promise.all([
        localAdapter.getSuppliers(),
        localAdapter.getPurchases(),
        localAdapter.getReceivables()
      ]);
      setSuppliers(supps || []);
      setPurchases(purchs || []);
      setReceivables(recs || []);

      // Hentikan loading screen segera agar pengguna bisa langsung berinteraksi tanpa delay
      setLoading(false);

      // 2. Instansiasi adapter yang sesuai
      let activeAdapter: IDataProvider = localAdapter;
      if (currentSettings.dataSourceMode === 'google_sheets' && currentSettings.googleSheetsUrl) {
        activeAdapter = new GoogleSheetsAdapter(currentSettings.googleSheetsUrl);
      } else if (currentSettings.dataSourceMode === 'spring_boot') {
        activeAdapter = new SpringBootAdapter(currentSettings.springBootApiUrl);
      }
      setProvider(activeAdapter);

      // 3. Jika mode cloud dan online, revalidasi data terbaru di latar belakang
      if (navigator.onLine && currentSettings.dataSourceMode !== 'indexeddb') {
        activeAdapter.getInitialData().then((cloudData) => {
          if (cloudData && cloudData.products && cloudData.products.length > 0) {
            setProducts(cloudData.products);
            setCategories(cloudData.categories || []);
            setCustomers(cloudData.customers || []);
            setCoa(cloudData.coa || []);
          }
        }).catch((err) => {
          console.warn('Latar belakang revalidasi cloud gagal, tetap menggunakan cache lokal:', err);
        });
      }
    } catch (err) {
      console.error('Error saat inisialisasi aplikasi:', err);
      setLoading(false);
    }
  };

  // Muat data lokal secara instan (< 10ms) agar semua aksi (tambah/update/hapus/kasir) super smooth
  const refreshData = async () => {
    try {
      const localAdapter = new IndexedDbAdapter();
      const data = await localAdapter.getInitialData();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setCustomers(data.customers || []);
      setCoa(data.coa || []);

      const [supps, purchs, recs] = await Promise.all([
        localAdapter.getSuppliers(),
        localAdapter.getPurchases(),
        localAdapter.getReceivables()
      ]);
      setSuppliers(supps || []);
      setPurchases(purchs || []);
      setReceivables(recs || []);
    } catch (err) {
      console.error('Gagal memperbarui data lokal:', err);
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

  const clearAllData = async () => {
    setLoading(true);
    try {
      const localAdapter = new IndexedDbAdapter();
      await localAdapter.clearAllData();
      if (provider.clearAllData && provider !== (localAdapter as any)) {
        await provider.clearAllData();
      }
      setSettings(DEFAULT_SETTINGS);
      await refreshData();
      await refreshOutboxCount();
    } catch (err) {
      console.error('Gagal mengosongkan data:', err);
    } finally {
      setLoading(false);
    }
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
        clearAllData,
        testConnection,
        switchDataSourceMode
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
