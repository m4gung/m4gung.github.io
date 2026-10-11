import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, seedInitialLocalDataIfEmpty, type LocalOutlet } from '../db/cafeDb';
import { syncManager, type BackendMode, type SyncStatus } from '../api/syncManager';

interface PrinterConfig {
  type: 'BLUETOOTH' | 'USB' | 'BROWSER';
  paperWidth: 58 | 80;
  autoCut: boolean;
  deviceName?: string;
}

interface AppContextType {
  cafeName: string;
  setCafeName: (name: string) => Promise<void>;
  outlets: LocalOutlet[];
  activeOutlet: LocalOutlet | undefined;
  setActiveOutletId: (id: number) => Promise<void>;
  addOutlet: (name: string, address: string, phone: string) => Promise<void>;
  backendMode: BackendMode;
  gasUrl: string;
  updateBackendSettings: (mode: BackendMode, gasUrl: string) => Promise<void>;
  printerConfig: PrinterConfig;
  updatePrinterConfig: (config: PrinterConfig) => Promise<void>;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
  user: { username: string; role: string; fullName: string } | null;
  setUser: React.Dispatch<React.SetStateAction<{ username: string; role: string; fullName: string } | null>>;
  activeTab: 'POS' | 'KITCHEN' | 'ORDERS' | 'MENU' | 'INVENTORY' | 'EXPENSES' | 'REPORTS' | 'SETTINGS';
  setActiveTab: (tab: 'POS' | 'KITCHEN' | 'ORDERS' | 'MENU' | 'INVENTORY' | 'EXPENSES' | 'REPORTS' | 'SETTINGS') => void;
  isReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cafeName, setCafeNameState] = useState<string>('CafeFlow Nusantara');
  const [outlets, setOutlets] = useState<LocalOutlet[]>([]);
  const [activeOutletId, setActiveOutletIdState] = useState<number>(1);
  const [backendMode, setBackendMode] = useState<BackendMode>('SPRING_BOOT');
  const [gasUrl, setGasUrl] = useState<string>('');
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    type: 'BROWSER',
    paperWidth: 58,
    autoCut: true,
    deviceName: ''
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('ONLINE');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [user, setUser] = useState<{ username: string; role: string; fullName: string } | null>({
    username: 'owner',
    role: 'OWNER',
    fullName: 'Pemilik Kafe'
  });
  const [activeTab, setActiveTab] = useState<'POS' | 'KITCHEN' | 'ORDERS' | 'MENU' | 'INVENTORY' | 'EXPENSES' | 'REPORTS' | 'SETTINGS'>('POS');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      await seedInitialLocalDataIfEmpty();

      const nameItem = await db.appSettings.get('cafeName');
      if (nameItem) setCafeNameState(nameItem.value);

      const activeOutItem = await db.appSettings.get('activeOutletId');
      if (activeOutItem) setActiveOutletIdState(Number(activeOutItem.value));

      const modeItem = await db.appSettings.get('backendMode');
      if (modeItem) setBackendMode(modeItem.value);

      const gasItem = await db.appSettings.get('gasUrl');
      if (gasItem) setGasUrl(gasItem.value);

      const printItem = await db.appSettings.get('printerConfig');
      if (printItem) setPrinterConfig(printItem.value);

      const allOutlets = await db.outlets.toArray();
      setOutlets(allOutlets);
      setIsReady(true);
    }

    loadData();

    const unsubscribe = syncManager.subscribe((status, pending) => {
      setSyncStatus(status);
      setPendingSyncCount(pending);
    });

    return () => unsubscribe();
  }, []);

  const setCafeName = async (name: string) => {
    setCafeNameState(name);
    await db.appSettings.put({ key: 'cafeName', value: name });
  };

  const setActiveOutletId = async (id: number) => {
    setActiveOutletIdState(id);
    await db.appSettings.put({ key: 'activeOutletId', value: id });
  };

  const addOutlet = async (name: string, address: string, phone: string) => {
    const newId = Date.now();
    const newOutlet: LocalOutlet = {
      id: newId,
      tenantId: 1,
      name,
      address,
      phone,
      receiptHeader: 'Selamat Menikmati Kopi Anda',
      receiptFooter: 'Terima kasih atas kunjungan Anda!',
      taxPercentage: 10,
      serviceChargePercentage: 0,
      isActive: true
    };
    await db.outlets.put(newOutlet);
    setOutlets(await db.outlets.toArray());
  };

  const updateBackendSettings = async (mode: BackendMode, newGasUrl: string) => {
    setBackendMode(mode);
    setGasUrl(newGasUrl);
    await db.appSettings.put({ key: 'backendMode', value: mode });
    await db.appSettings.put({ key: 'gasUrl', value: newGasUrl });
  };

  const updatePrinterConfig = async (newConfig: PrinterConfig) => {
    setPrinterConfig(newConfig);
    await db.appSettings.put({ key: 'printerConfig', value: newConfig });
  };

  const triggerSync = async () => {
    await syncManager.triggerSync();
  };

  const activeOutlet = outlets.find((o) => o.id === activeOutletId) || outlets[0];

  return (
    <AppContext.Provider
      value={{
        cafeName,
        setCafeName,
        outlets,
        activeOutlet,
        setActiveOutletId,
        addOutlet,
        backendMode,
        gasUrl,
        updateBackendSettings,
        printerConfig,
        updatePrinterConfig,
        syncStatus,
        pendingSyncCount,
        triggerSync,
        user,
        setUser,
        activeTab,
        setActiveTab,
        isReady
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
