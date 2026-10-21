import { useState } from 'react';
import {
  Hexagon,
  Edit3,
  Trash2,
  BookmarkPlus,
} from 'lucide-react';
import { useMeasurement } from '../../features/measurement/useMeasurement';
import { PARCEL_COLORS } from '../../features/measurement/measurement.types';

interface MeasurementToolbarProps {
  onStartDraw: () => void;
  onToggleEdit: () => void;
  onClear: () => void;
  onOpenSaveModal?: () => void;
}

export function MeasurementToolbar({
  onStartDraw,
  onToggleEdit,
  onClear,
  onOpenSaveModal,
}: MeasurementToolbarProps) {
  const { mode, activeCoordinates, selectedColor, setSelectedColor } = useMeasurement();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const hasPolygon = Boolean(activeCoordinates && activeCoordinates.length >= 3);

  return (
    <div
      className="absolute top-3 left-3 z-[600] flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95"
      role="toolbar"
      aria-label="Alat Pengukuran Lahan"
    >
      {/* Tombol Gambar Poligon */}
      <button
        type="button"
        onClick={onStartDraw}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
          mode === 'draw'
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        title="Mulai menggambar batas bidang tanah"
        aria-label={mode === 'draw' ? 'Sedang Menggambar' : 'Ukur Lahan'}
      >
        <Hexagon className="size-4" />
        <span className="hidden sm:inline">
          {mode === 'draw' ? 'Sedang Menggambar...' : 'Ukur Lahan'}
        </span>
      </button>

      {/* Tombol Edit Titik / Drag */}
      {hasPolygon && (
        <button
          type="button"
          onClick={onToggleEdit}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
            mode === 'edit'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Geser atau ubah titik patok poligon"
        >
          <Edit3 className="size-4" />
          <span className="hidden sm:inline">
            {mode === 'edit' ? 'Selesai Edit' : 'Edit Patok'}
          </span>
        </button>
      )}

      {/* Pemilih Warna Batas */}
      {hasPolygon && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1.5 rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Pilih warna batas lahan"
            aria-label="Pilih warna batas lahan"
          >
            <div
              className="size-4 rounded-full border border-black/20"
              style={{ backgroundColor: selectedColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 flex gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
              {PARCEL_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.hex);
                    setShowColorPicker(false);
                  }}
                  className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === c.hex ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tombol Simpan Lahan */}
      {hasPolygon && onOpenSaveModal && (
        <button
          type="button"
          onClick={onOpenSaveModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
          title="Simpan bidang tanah ke database"
        >
          <BookmarkPlus className="size-4" />
          <span className="hidden sm:inline">Simpan Lahan</span>
        </button>
      )}

      {/* Tombol Hapus / Reset Poligon */}
      {hasPolygon && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          title="Hapus bidang pengukuran"
          aria-label="Hapus bidang pengukuran"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
