import { FileText, LandPlot, LayoutDashboard, List, Map as MapIcon, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/peta', label: 'Peta & Pengukuran', icon: MapIcon },
  { to: '/lahan', label: 'Daftar Lahan', icon: List },
  { to: '/laporan', label: 'Laporan', icon: FileText },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

export const APP_ICON = LandPlot;
export const APP_NAME = 'GeoLahan Pro';
export const APP_VERSION = '0.1.0';
