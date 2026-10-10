import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { KasirPage } from './pages/KasirPage';
import { ProdukPage } from './pages/ProdukPage';
import { PembelianPage } from './pages/PembelianPage';
import { PiutangPage } from './pages/PiutangPage';
import { AkuntansiPage } from './pages/AkuntansiPage';
import { PengaturanPage } from './pages/PengaturanPage';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
        {activeTab === 'kasir' && <KasirPage />}
        {activeTab === 'produk' && <ProdukPage />}
        {activeTab === 'pembelian' && <PembelianPage />}
        {activeTab === 'piutang' && <PiutangPage />}
        {activeTab === 'akuntansi' && <AkuntansiPage />}
        {activeTab === 'pengaturan' && <PengaturanPage />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
