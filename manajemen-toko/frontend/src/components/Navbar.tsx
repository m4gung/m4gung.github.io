import React from 'react';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  BookOpen, 
  Settings, 
  LayoutDashboard, 
  Wifi, 
  WifiOff, 
  FileSpreadsheet,
  Server,
  Truck,
  Database
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { settings, isOnline } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kasir', label: 'Kasir POS', icon: ShoppingCart },
    { id: 'produk', label: 'Produk & Stok', icon: Package },
    { id: 'pembelian', label: 'Pembelian', icon: Truck },
    { id: 'piutang', label: 'Piutang', icon: CreditCard },
    { id: 'akuntansi', label: 'Akuntansi', icon: BookOpen },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const getStorageBadge = () => {
    switch (settings.dataSourceMode) {
      case 'google_sheets':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Google Sheets
          </span>
        );
      case 'spring_boot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            <Server className="w-3.5 h-3.5" />
            Backend Java
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
            <Database className="w-3.5 h-3.5" />
            Lokal (IndexedDB)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {settings.storeName || 'Toko UMKM'}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Manajemen Toko, POS & Akuntansi
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {getStorageBadge()}

            {isOnline ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-1 py-1 shadow-lg">
        <div className="grid grid-cols-7 gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-brand-600 font-bold bg-brand-50' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-brand-600' : 'text-gray-500'}`} />
                <span className="truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
