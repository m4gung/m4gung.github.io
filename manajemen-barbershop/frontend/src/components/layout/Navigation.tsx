import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scissors,
  ShoppingBag,
  Package,
  Users,
  UserCheck,
  CalendarCheck,
  BadgeDollarSign,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

export const Header: React.FC = () => {
  const { isOnline, pendingSyncCount, settings, triggerManualSync } = useApp();

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-600/20">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-neutral-100 leading-tight">
            {settings?.shopName || 'Barbershop POS'}
          </h1>
          <p className="text-xs text-amber-500 font-medium tracking-wide">
            {settings?.storageMode === 'GOOGLE_SHEETS' ? 'Cloud: Google Spreadsheet' : 'Cloud: Spring Boot'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Network & Sync Badge */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full py-1 px-3 gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1 border-l border-neutral-800 pl-2 text-xs text-amber-400">
              <span className="font-semibold">{pendingSyncCount}</span>
              <span className="hidden md:inline text-[11px] text-neutral-400">antrean sync</span>
            </div>
          )}

          <button
            onClick={triggerManualSync}
            title="Sinkronkan data ke Cloud"
            className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-amber-400 transition-colors ml-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingBag },
    { id: 'services', label: 'Layanan', icon: Scissors },
    { id: 'products', label: 'Produk Retail', icon: Package },
    { id: 'attendance', label: 'Absensi', icon: CalendarCheck },
    { id: 'barbers', label: 'Barber', icon: UserCheck },
    { id: 'customers', label: 'Pelanggan', icon: Users },
    { id: 'payroll', label: 'Komisi & Gaji', icon: BadgeDollarSign },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 p-4 hidden lg:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase px-3 py-2">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-400">
        <p className="font-medium text-neutral-200">Mode Cepat Offline</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Data disimpan lokal seketika & tersinkron aman ke cloud.
        </p>
      </div>
    </aside>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const mainItems = [
    { id: 'pos', label: 'Kasir', icon: ShoppingBag },
    { id: 'attendance', label: 'Absensi', icon: CalendarCheck },
    { id: 'services', label: 'Layanan', icon: Scissors },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Setting', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 h-16 flex items-center justify-around px-2 z-40">
      {mainItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-12 py-1 transition-all ${
              isActive ? 'text-amber-400 font-semibold scale-105' : 'text-neutral-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
