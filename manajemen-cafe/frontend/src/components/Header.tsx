import React from 'react';
import { Coffee, Store, Wifi, WifiOff, RefreshCw, ShoppingCart, Clock, Settings, UtensilsCrossed, Package, ShoppingBag, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    cafeName,
    outlets,
    activeOutlet,
    setActiveOutletId,
    syncStatus,
    pendingSyncCount,
    triggerSync,
    activeTab,
    setActiveTab,
    backendMode
  } = useApp();

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Brand & Active Outlet Switcher */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-600/20 text-amber-500 p-2 rounded-xl flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight flex items-center gap-1.5">
              <span>{cafeName}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                PWA
              </span>
            </h1>

            {/* Multi-Outlet Dropdown */}
            <div className="flex items-center space-x-1 text-xs text-stone-400 mt-0.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <select
                aria-label="Pilih Cabang Outlet"
                value={activeOutlet?.id || 1}
                onChange={(e) => setActiveOutletId(Number(e.target.value))}
                className="bg-transparent text-amber-200 border-none text-xs font-medium focus:ring-0 cursor-pointer hover:text-amber-100 py-0 pl-0 pr-4"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id} className="bg-stone-800 text-stone-100">
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center space-x-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700/50">
          <button
            onClick={() => setActiveTab('POS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'POS' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir POS</span>
          </button>
          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'KITCHEN' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dapur KDS</span>
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'ORDERS' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Riwayat Pesanan</span>
          </button>
          <button
            onClick={() => setActiveTab('MENU')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'MENU' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Menu & Meja</span>
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'INVENTORY' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventaris & BOM</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'EXPENSES' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Beli & Biaya</span>
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'REPORTS' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'SETTINGS' ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </button>
        </nav>

        {/* Sync Status Badge & Action */}
        <div className="flex items-center space-x-2">
          {/* Backend Mode Pill */}
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
            {backendMode === 'SPRING_BOOT' && 'Spring Boot'}
            {backendMode === 'APPS_SCRIPT' && 'Apps Script'}
            {backendMode === 'DUAL' && 'Dual Sync'}
          </span>

          {/* Online/Offline Status */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              syncStatus === 'ONLINE'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                : syncStatus === 'SYNCING'
                ? 'bg-sky-950/60 text-sky-400 border-sky-800/60'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
            }`}
          >
            {syncStatus === 'ONLINE' && <Wifi className="w-3.5 h-3.5" />}
            {syncStatus === 'OFFLINE' && <WifiOff className="w-3.5 h-3.5" />}
            {syncStatus === 'SYNCING' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            
            <span>{syncStatus === 'ONLINE' ? 'Online' : syncStatus === 'SYNCING' ? 'Sync...' : 'Offline'}</span>
            
            {pendingSyncCount > 0 && (
              <span className="ml-1 bg-amber-500 text-stone-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingSyncCount}
              </span>
            )}
          </div>

          {/* Sync Now Button */}
          {pendingSyncCount > 0 && (
            <button
              onClick={() => triggerSync()}
              title="Kirim data offline ke server sekarang"
              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
