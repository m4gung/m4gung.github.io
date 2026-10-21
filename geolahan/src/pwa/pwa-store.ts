/**
 * Status PWA di luar React (event beforeinstallprompt dan pembaruan service worker bisa
 * terjadi sebelum komponen ter-mount). Dibaca komponen lewat useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  /** Browser menawarkan instalasi (event beforeinstallprompt tertangkap). */
  canInstall: boolean;
  /** Aplikasi sedang berjalan sebagai PWA terpasang. */
  isStandalone: boolean;
  /** Versi baru sudah diunduh dan menunggu dimuat ulang. */
  updateReady: boolean;
  /** Service worker aktif sehingga aplikasi dapat dibuka offline. */
  offlineReady: boolean;
}

const detectStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

let state: PwaState = { canInstall: false, isStandalone: detectStandalone(), updateReady: false, offlineReady: false };
let installEvent: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function usePwaState(): PwaState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!installEvent) return 'unavailable';
  const ev = installEvent;
  installEvent = null;
  set({ canInstall: false });
  await ev.prompt();
  return (await ev.userChoice).outcome;
}

export function applyUpdate(): void {
  if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
}

export function initPwa(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    set({ canInstall: false, isStandalone: true });
  });

  // Service worker hanya untuk build produksi (hindari cache membingungkan saat dev).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Reload hanya setelah pengguna menerapkan pembaruan (bukan pada instalasi pertama).
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .then((reg) => {
      const track = (worker: ServiceWorker | null) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state !== 'installed') return;
          if (navigator.serviceWorker.controller) {
            waitingWorker = worker;
            set({ updateReady: true });
          } else {
            set({ offlineReady: true });
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        set({ updateReady: true });
      }
      if (reg.active) set({ offlineReady: true });
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      // Cek pembaruan berkala saat aplikasi dibiarkan terbuka.
      window.setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
    })
    .catch(() => {
      /* registrasi gagal (mis. mode privat); aplikasi tetap berjalan online */
    });
}
