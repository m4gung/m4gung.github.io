import { useState } from 'react';
import {
  Copy,
  Check,
  MapPin,
  Ruler,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMeasurement } from '../../features/measurement/useMeasurement';
import { formatNumberId, formatCoord } from '../../features/measurement/geometry.service';

export function MeasurementPanel() {
  const { measurement, mode } = useMeasurement();
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!measurement && mode === 'idle') {
    return null;
  }

  const copyCoordinates = async () => {
    if (!measurement || measurement.controlPoints.length === 0) return;
    const text = measurement.controlPoints
      .map((cp) => `${cp.label}: Lat ${formatCoord(cp.latitude)}, Lon ${formatCoord(cp.longitude)} (Jarak: ${formatNumberId(cp.distanceToNextM)}m)`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback jika clipboard tidak didukung
    }
  };

  return (
    <div
      className="absolute bottom-4 left-4 z-[650] w-[calc(100%-2rem)] max-w-sm sm:max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/95"
      role="region"
      aria-label="Panel Pengukuran Lahan"
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <Ruler className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Hasil Pengukuran
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={isCollapsed ? 'Perluas panel' : 'Ciutkan panel'}
        >
          {isCollapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {/* Peringatan jika belum ada poligon atau masih menggambar */}
      {!measurement && mode === 'draw' && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <MapPin className="size-4 shrink-0 animate-bounce text-emerald-600" />
          <span>Klik pada peta untuk menentukan titik patok batas lahan.</span>
        </div>
      )}

      {/* Peringatan jika poligon tidak valid */}
      {measurement && !measurement.isValid && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-600" />
          <span>{measurement.validationError || 'Geometri poligon tidak valid.'}</span>
        </div>
      )}

      {/* Isi Hasil Pengukuran */}
      {measurement && measurement.isValid && !isCollapsed && (
        <div className="mt-3 space-y-3">
          {/* Grid Metrik Luas & Keliling */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Luas (m²)
              </span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">
                {formatNumberId(measurement.areaM2)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Are
              </span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">
                {formatNumberId(measurement.areaAre)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Hektare
              </span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">
                {formatNumberId(measurement.areaHa, 4)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3 py-2 text-xs dark:bg-emerald-950/30">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Keliling Total:</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              {formatNumberId(measurement.perimeterM)} meter
            </span>
          </div>

          {/* Tabel Titik Patok */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Titik Patok ({measurement.controlPoints.length} Titik)
              </span>
              <button
                type="button"
                onClick={copyCoordinates}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? 'Tersalin' : 'Salin Koordinat'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 text-[11px] dark:border-slate-800 dark:bg-slate-900/40">
              <table className="w-full text-left">
                <thead className="border-b border-slate-200/60 bg-slate-100/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Patok</th>
                    <th className="px-2 py-1">Latitude</th>
                    <th className="px-2 py-1">Longitude</th>
                    <th className="px-2 py-1 text-right">Jarak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {measurement.controlPoints.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/40">
                      <td className="px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        {cp.label}
                      </td>
                      <td className="px-2 py-1 text-slate-600 dark:text-slate-300">
                        {formatCoord(cp.latitude)}
                      </td>
                      <td className="px-2 py-1 text-slate-600 dark:text-slate-300">
                        {formatCoord(cp.longitude)}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-500 dark:text-slate-400">
                        {formatNumberId(cp.distanceToNextM)} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
