import { Navigate, createHashRouter } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { MapPage } from '../pages/MapPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ParcelDetailPage } from '../pages/ParcelDetailPage';
import { ParcelsPage } from '../pages/ParcelsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

// HashRouter: aman untuk hosting statis (GitHub Pages) tanpa konfigurasi rewrite server.
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/peta" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'peta', element: <MapPage /> },
      { path: 'lahan', element: <ParcelsPage /> },
      { path: 'lahan/:parcelId', element: <ParcelDetailPage /> },
      { path: 'laporan', element: <ReportsPage /> },
      { path: 'pengaturan', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
