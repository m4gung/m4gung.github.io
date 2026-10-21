import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PwaUpdatePrompt } from '../common/PwaUpdatePrompt';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export function AppLayout() {
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useLocalStorage('geolahan:sidebarCollapsed', false, isBoolean);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Tutup drawer mobile saat berpindah ke desktop atau ketika rute berubah.
  const [prevKey, setPrevKey] = useState(`${location.pathname}|${isDesktop}`);
  const currentKey = `${location.pathname}|${isDesktop}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (mobileOpen) setMobileOpen(false);
  }

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) setCollapsed(!collapsed);
    else setMobileOpen((open) => !open);
  }, [isDesktop, collapsed, setCollapsed]);

  // Cegah halaman di belakang drawer ikut menggulir.
  useEffect(() => {
    if (isDesktop || !mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDesktop, mobileOpen]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <Header
        ref={menuButtonRef}
        isDesktop={isDesktop}
        sidebarCollapsed={collapsed}
        mobileSidebarOpen={mobileOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar isDesktop={isDesktop} collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={closeMobile} />
        <main id="main-content" tabIndex={-1} className="relative min-w-0 flex-1 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
      <PwaUpdatePrompt />
    </div>
  );
}
