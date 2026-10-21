import { RefreshCw } from 'lucide-react';
import { applyUpdate, usePwaState } from '../../pwa/pwa-store';

export function PwaUpdatePrompt() {
  const { updateReady } = usePwaState();
  if (!updateReady) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[3000] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-sm text-white shadow-2xl"
    >
      <span>Versi baru GeoLahan Pro tersedia.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3 font-semibold hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <RefreshCw className="size-4" aria-hidden="true" /> Muat ulang
      </button>
    </div>
  );
}
