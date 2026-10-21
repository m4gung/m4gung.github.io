import { Crosshair, LocateFixed, MapPinPlus, Check, Circle, Square, Trash2, TriangleAlert } from 'lucide-react';
import {
  GPS_DISCLAIMER,
  formatCoord,
  isAccuracyPoor,
  type GpsFix,
  type GpsStatus,
} from '../../features/gps/gps.service';

interface GpsControlsProps {
  status: GpsStatus;
  fix: GpsFix | null;
  error: string | null;
  isTracking: boolean;
  trackCount: number;
  trackNotice: string | null;
  /** Lintasan selesai menunggu konfirmasi pengguna. */
  pendingTrackCount: number | null;
  onLocate: () => void;
  onAddPatok: () => void;
  onToggleTrack: () => void;
  onConfirmTrack: () => void;
  onDiscardTrack: () => void;
}

const STATUS_LABEL: Record<GpsStatus, string> = {
  idle: 'Belum aktif',
  requesting: 'Mencari sinyal…',
  active: 'Aktif',
  denied: 'Izin ditolak',
  unavailable: 'Tidak tersedia',
  timeout: 'Waktu habis',
  unsupported: 'Tidak didukung',
};

const btn =
  'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium shadow-lg border border-slate-200/80 bg-white/95 text-slate-800 hover:bg-emerald-50 dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800 disabled:opacity-50';

export function GpsControls(props: GpsControlsProps) {
  const { status, fix, error, isTracking, trackCount, trackNotice, pendingTrackCount } = props;
  const busy = status === 'requesting';
  const unsupported = status === 'unsupported';

  return (
    <div className="absolute right-3 bottom-28 z-[700] flex w-64 max-w-[calc(100%-1.5rem)] flex-col items-end gap-2">
      {(fix || error) && (
        <div
          role="status"
          aria-label="Status GPS"
          className="w-full rounded-2xl border border-slate-200/80 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-200"
        >
          <div className="mb-1 flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1">
              <Crosshair className="size-3.5" aria-hidden="true" /> GPS
            </span>
            <span data-testid="gps-status">{STATUS_LABEL[status]}</span>
          </div>
          {fix && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
              <dt className="text-slate-500">Lat</dt>
              <dd data-testid="gps-lat">{formatCoord(fix.latitude)}</dd>
              <dt className="text-slate-500">Lon</dt>
              <dd data-testid="gps-lon">{formatCoord(fix.longitude)}</dd>
              <dt className="text-slate-500">Akurasi</dt>
              <dd data-testid="gps-accuracy">±{fix.accuracyM.toFixed(1)} m</dd>
              <dt className="text-slate-500">Waktu</dt>
              <dd>{new Date(fix.timestamp).toLocaleTimeString('id-ID')}</dd>
            </dl>
          )}
          {error && (
            <p className="mt-1 flex items-start gap-1 text-red-600 dark:text-red-400" role="alert">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          )}
          {fix && isAccuracyPoor(fix.accuracyM) && (
            <p className="mt-1 flex items-start gap-1 text-amber-700 dark:text-amber-300" data-testid="gps-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Akurasi rendah (&gt; 20 m). Pindah ke area terbuka sebelum mengambil patok.
            </p>
          )}
          <p className="mt-1 text-[10px] leading-snug text-slate-500">
            {GPS_DISCLAIMER} Enam desimal adalah format tampilan, bukan bukti akurasi fisik.
          </p>
        </div>
      )}

      {isTracking && (
        <div role="status" className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white shadow-lg">
          Merekam lintasan: <strong data-testid="track-count">{trackCount}</strong> titik
          {trackNotice && <div className="mt-0.5 opacity-90">{trackNotice}</div>}
        </div>
      )}

      {pendingTrackCount !== null && (
        <div
          role="dialog"
          aria-label="Konfirmasi lintasan"
          className="w-full rounded-2xl border border-emerald-300 bg-white p-3 text-xs shadow-xl dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <p className="mb-2">
            Lintasan berisi <strong>{pendingTrackCount}</strong> titik. Jadikan bidang tanah dan hitung ulang luas,
            keliling, serta jarak sisi?
          </p>
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={props.onConfirmTrack}>
              <Check className="size-4" aria-hidden="true" /> Jadikan Bidang
            </button>
            <button type="button" className={btn} onClick={props.onDiscardTrack}>
              <Trash2 className="size-4" aria-hidden="true" /> Buang
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={btn} onClick={props.onLocate} disabled={busy || unsupported}>
          <LocateFixed className="size-4" aria-hidden="true" /> Lokasi Saya
        </button>
        <button
          type="button"
          className={btn}
          onClick={props.onAddPatok}
          disabled={busy || unsupported || isTracking}
        >
          <MapPinPlus className="size-4" aria-hidden="true" /> Tambah Patok GPS
        </button>
        <button type="button" className={btn} onClick={props.onToggleTrack} disabled={unsupported}>
          {isTracking ? (
            <>
              <Square className="size-4 text-red-600" aria-hidden="true" /> Selesai Rekam
            </>
          ) : (
            <>
              <Circle className="size-4 text-red-600" aria-hidden="true" /> Rekam Lintasan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
