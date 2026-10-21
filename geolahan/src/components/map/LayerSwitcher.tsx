import { useEffect, useId, useRef, useState } from 'react';
import { Check, Globe, Layers, Map as MapIcon, Satellite } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BASE_LAYER_IDS, BASE_LAYERS, type BaseLayerId } from '../../features/map/map.config';
import { useMapController } from './map-controller';

const LAYER_ICONS: Record<BaseLayerId, LucideIcon> = {
  satellite: Satellite,
  hybrid: Globe,
  osm: MapIcon,
};

/** Pemilih layer dasar yang mengambang di kanan atas peta. */
export function LayerSwitcher() {
  const { baseLayer, setBaseLayer } = useMapController();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const ActiveIcon = LAYER_ICONS[baseLayer];

  return (
    <div ref={rootRef} className="absolute top-3 right-3 z-[600] flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="map-fab"
        title="Pilih layer peta"
        aria-label="Pilih layer peta"
      >
        <Layers className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">{BASE_LAYERS[baseLayer].label}</span>
        <ActiveIcon className="size-4 opacity-70 sm:hidden" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          role="radiogroup"
          aria-label="Layer peta"
          className="w-64 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        >
          {BASE_LAYER_IDS.map((id) => {
            const layer = BASE_LAYERS[id];
            const Icon = LAYER_ICONS[id];
            const active = id === baseLayer;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setBaseLayer(id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{layer.label}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{layer.description}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
