import { useState, useEffect } from 'react';
import { seedInitialDataIfEmpty } from './db';
import { AppProvider, useApp } from './context/AppContext';
import { Header, Navigation, MobileBottomNav } from './components/layout/Navigation';

// Halaman-halaman dari barrel export
import {
  PosPage,
  AttendancePage,
  BranchesPage,
  ServicesPage,
  ProductsPage,
  BarbersPage,
  CustomersPage,
  PayrollPage,
  ReportsPage,
  SettingsPage
} from './pages';

function AppContent() {
  const { activeTab, toastMessage } = useApp();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Navigation />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          {activeTab === 'pos' && <PosPage />}
          {activeTab === 'branches' && <BranchesPage />}
          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'services' && <ServicesPage />}
          {activeTab === 'products' && <ProductsPage />}
          {activeTab === 'barbers' && <BarbersPage />}
          {activeTab === 'customers' && <CustomersPage />}
          {activeTab === 'payroll' && <PayrollPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <MobileBottomNav />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2.5 ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                : 'bg-emerald-950 border-emerald-800 text-emerald-200'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      await seedInitialDataIfEmpty();
      setIsReady(true);
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-amber-500">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-neutral-400 font-medium">Menyiapkan database lokal...</p>
      </div>
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
