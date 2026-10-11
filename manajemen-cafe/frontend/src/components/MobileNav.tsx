import React from 'react';
import { ShoppingCart, Clock, Coffee, Settings, UtensilsCrossed, Package, ShoppingBag, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-800 text-stone-300 z-30 pb-safe">
      <div className="grid grid-cols-8 py-2">
        <button
          onClick={() => setActiveTab('POS')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'POS' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="text-[7px]">Kasir</span>
        </button>

        <button
          onClick={() => setActiveTab('KITCHEN')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'KITCHEN' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span className="text-[7px]">Dapur</span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'ORDERS' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[7px]">Pesanan</span>
        </button>

        <button
          onClick={() => setActiveTab('MENU')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'MENU' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span className="text-[7px]">Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'INVENTORY' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span className="text-[7px]">Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'EXPENSES' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="text-[7px]">Biaya</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'REPORTS' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="text-[7px]">Lapor</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'SETTINGS' ? 'text-amber-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="text-[7px]">Setting</span>
        </button>
      </div>
    </nav>
  );
};
