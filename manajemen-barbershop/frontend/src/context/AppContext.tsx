import React, { createContext, useContext, useState, useEffect } from 'react';
import { SyncEngine } from '../services/syncEngine';
import { db } from '../db';
import type { ShopSettings, Branch } from '../types';

interface AppContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  settings: ShopSettings | null;
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranchId: (branchId: string) => Promise<void>;
  reloadBranches: () => Promise<void>;
  activeTab: 'pos' | 'services' | 'products' | 'barbers' | 'attendance' | 'customers' | 'payroll' | 'reports' | 'branches' | 'settings';
  setActiveTab: (tab: any) => void;
  triggerManualSync: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<any>('pos');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadBranches = async (currentSettings?: ShopSettings | null) => {
    const list = await db.branches.filter(b => b.isActive).toArray();
    setBranches(list);

    const s = currentSettings || (await db.settings.get('default'));
    if (list.length > 0) {
      const activeId = s?.activeBranchId;
      const found = list.find(b => b.id === activeId) || list[0];
      setActiveBranch(found);
    }
  };

  const loadSettings = async () => {
    const s = await db.settings.get('default');
    if (s) {
      setSettings(s);
      await loadBranches(s);
    }
  };

  const setActiveBranchId = async (branchId: string) => {
    const found = branches.find(b => b.id === branchId);
    if (found) {
      setActiveBranch(found);
      await db.settings.update('default', { activeBranchId: branchId });
      if (settings) {
        setSettings({ ...settings, activeBranchId: branchId });
      }
      showToast(`Beralih ke cabang: ${found.name}`, 'info');
    }
  };

  useEffect(() => {
    loadSettings();
    SyncEngine.init();

    const unsubscribe = SyncEngine.subscribe((online: boolean, count: number) => {
      setIsOnline(online);
      setPendingSyncCount(count);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const triggerManualSync = async () => {
    showToast('Memulai sinkronisasi ke server...', 'info');
    const res = await SyncEngine.triggerAutoSync();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        settings,
        branches,
        activeBranch,
        setActiveBranchId,
        reloadBranches: () => loadBranches(settings),
        activeTab,
        setActiveTab,
        triggerManualSync,
        reloadSettings: loadSettings,
        toastMessage,
        showToast
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
