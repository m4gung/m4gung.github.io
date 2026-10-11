import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { PosPage } from './pages/PosPage';
import { KitchenPage } from './pages/KitchenPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasingExpensePage } from './pages/PurchasingExpensePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MobileNav } from './components/MobileNav';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col pb-16 md:pb-0">
      <Header />
      <main className="flex-1 flex flex-col">
        {activeTab === 'POS' && <PosPage />}
        {activeTab === 'KITCHEN' && <KitchenPage />}
        {activeTab === 'ORDERS' && <OrdersPage />}
        {activeTab === 'MENU' && <MenuPage />}
        {activeTab === 'INVENTORY' && <InventoryPage />}
        {activeTab === 'EXPENSES' && <PurchasingExpensePage />}
        {activeTab === 'REPORTS' && <ReportsPage />}
        {activeTab === 'SETTINGS' && <SettingsPage />}
      </main>
      <MobileNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
