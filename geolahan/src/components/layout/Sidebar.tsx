import { useEffect, useRef } from 'react';
import { Inbox, X, MapPin } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import { APP_NAME, APP_VERSION, NAV_ITEMS } from '../../app/navigation';
import { EmptyState } from '../common/EmptyState';
import { useParcels } from '../../features/parcels/useParcels';
import { useMeasurement } from '../../features/measurement/useMeasurement';
import { formatNumberId } from '../../features/measurement/geometry.service';

interface SidebarProps {
  isDesktop: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Sidebar navigasi.
 * - Desktop (≥ lg): menempel di kiri, dapat diciutkan menjadi mode ikon.
 * - Mobile: drawer dengan overlay; ditutup lewat overlay, tombol X, Esc, atau memilih menu.
 */
export function Sidebar({ isDesktop, collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const panelRef = useRef<HTMLElement>(null);
  const compact = isDesktop && collapsed;
  const hiddenOnMobile = !isDesktop && !mobileOpen;
  const { parcels } = useParcels();
  const { setLoadedParcelId } = useMeasurement();
  const navigate = useNavigate();

  const handleSelectParcel = (id: string) => {
    setLoadedParcelId(id);
    if (!isDesktop) onCloseMobile();
    navigate('/peta');
  };

  useEffect(() => {
    if (isDesktop || !mobileOpen) return;
    // Pindahkan fokus ke drawer dan kunci Tab di dalamnya.
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMobile();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDesktop, mobileOpen, onCloseMobile]);

  return (
    <>
      {!isDesktop && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className={`fixed inset-0 z-[1190] bg-slate-950/50 backdrop-blur-[1px] transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
      )}

      <aside
        id="app-sidebar"
        ref={panelRef}
        aria-label="Navigasi utama"
        role={!isDesktop ? 'dialog' : undefined}
        aria-modal={!isDesktop && mobileOpen ? true : undefined}
        inert={hiddenOnMobile}
        className={`flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
          isDesktop
            ? `relative shrink-0 transition-[width] duration-200 ${compact ? 'w-16' : 'w-64'}`
            : `fixed inset-y-0 left-0 z-[1200] w-72 max-w-[85vw] shadow-2xl transition-transform duration-200 ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
              }`
        }`}
      >
        {!isDesktop && (
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-white">{APP_NAME}</span>
            <button type="button" onClick={onCloseMobile} className="icon-btn" aria-label="Tutup menu">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-1 p-2" aria-label="Menu">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => !isDesktop && onCloseMobile()}
              title={compact ? label : undefined}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none ${
                  compact ? 'justify-center px-0' : ''
                } ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className={compact ? 'sr-only' : 'truncate'}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {!compact && (
          <section className="mt-2 flex min-h-0 flex-1 flex-col border-t border-slate-200 dark:border-slate-800" aria-labelledby="saved-parcels-title">
            <h2
              id="saved-parcels-title"
              className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
            >
              Lahan Tersimpan ({parcels.length})
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1 space-y-1">
              {parcels.length === 0 ? (
                <EmptyState
                  compact
                  icon={Inbox}
                  title="Belum ada lahan"
                  description="Gunakan fitur Ukur Lahan di peta satelit lalu tekan Simpan Lahan."
                />
              ) : (
                parcels.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectParcel(p.id)}
                    className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <div
                      className="size-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatNumberId(p.areaM2)} m² {p.owner ? `• ${p.owner}` : ''}
                      </div>
                    </div>
                    <MapPin className="size-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </button>
                ))
              )}
            </div>
          </section>
        )}

        <footer className={`mt-auto border-t border-slate-200 px-4 py-3 text-[11px] text-slate-400 dark:border-slate-800 ${compact ? 'sr-only' : ''}`}>
          {APP_NAME} v{APP_VERSION} · WGS 84
          <br />
          Hasil pengukuran digital bersifat estimasi.
        </footer>
      </aside>
    </>
  );
}
