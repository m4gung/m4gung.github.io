import { forwardRef } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link } from 'react-router';
import { APP_ICON as AppIcon, APP_NAME } from '../../app/navigation';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { ThemeToggle } from '../common/ThemeToggle';
import { LocationSearch } from '../map/LocationSearch';

interface HeaderProps {
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header(
  { isDesktop, sidebarCollapsed, mobileSidebarOpen, onToggleSidebar },
  menuButtonRef,
) {
  const toggleLabel = isDesktop
    ? sidebarCollapsed
      ? 'Perluas sidebar'
      : 'Ciutkan sidebar'
    : mobileSidebarOpen
      ? 'Tutup menu'
      : 'Buka menu';
  const ToggleIcon = isDesktop ? (sidebarCollapsed ? PanelLeftOpen : PanelLeftClose) : Menu;

  return (
    <header className="relative z-[1000] flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:gap-3 sm:px-3 dark:border-slate-800 dark:bg-slate-900">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onToggleSidebar}
        className="icon-btn"
        aria-label={toggleLabel}
        title={toggleLabel}
        aria-controls="app-sidebar"
        aria-expanded={isDesktop ? !sidebarCollapsed : mobileSidebarOpen}
      >
        <ToggleIcon className="size-5" aria-hidden="true" />
      </button>

      <Link to="/peta" className="flex shrink-0 items-center gap-2 rounded-lg pr-1" aria-label={`${APP_NAME} — beranda peta`}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <AppIcon className="size-5" aria-hidden="true" />
        </span>
        <span className="hidden font-semibold tracking-tight text-slate-900 sm:inline dark:text-white">
          GeoLahan<span className="text-emerald-600 dark:text-emerald-400"> Pro</span>
        </span>
      </Link>

      <LocationSearch className="mx-auto min-w-0 flex-1 md:max-w-xl" />

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ConnectionStatus />
        <ThemeToggle />
      </div>
    </header>
  );
});
