import { useState } from 'react';
import { FileDown, Loader2, TriangleAlert } from 'lucide-react';
import type { Parcel } from '../../features/parcels/parcel.types';

type State =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; fileName: string; withMap: boolean };

/** Tombol Cetak PDF: menangkap peta lebih dulu; bila gagal, tawarkan coba lagi atau cetak tanpa peta. */
export function PrintReportControl({ parcel, compact = false }: { parcel: Parcel; compact?: boolean }) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  const run = async (withMap: boolean) => {
    setState({ kind: 'working' });
    try {
      const [{ saveParcelReport }, capture] = await Promise.all([
        import('../../features/report/pdf.service'),
        withMap ? import('../../features/report/map-capture.service') : Promise.resolve(null),
      ]);
      let map = null;
      if (withMap && capture) {
        try {
          map = await capture.captureParcelMap(parcel);
        } catch (e) {
          setState({
            kind: 'error',
            message: `Gambar peta gagal diambil: ${e instanceof Error ? e.message : 'penyebab tidak diketahui'}`,
          });
          return;
        }
      }
      const fileName = saveParcelReport(parcel, map);
      setState({ kind: 'done', fileName, withMap: Boolean(map) });
    } catch (e) {
      setState({ kind: 'error', message: `Gagal membuat PDF: ${e instanceof Error ? e.message : 'kesalahan tidak dikenal'}` });
    }
  };

  const busy = state.kind === 'working';
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => run(true)}
        disabled={busy}
        title="Cetak laporan PDF A4"
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${compact ? 'py-1.5' : 'py-2'}`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileDown className="size-4" aria-hidden="true" />}
        {busy ? 'Menyiapkan PDF…' : 'Cetak PDF'}
      </button>
      {state.kind === 'error' && (
        <div role="alert" className="max-w-xs rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="flex items-start gap-1">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {state.message}
          </p>
          <div className="mt-1.5 flex gap-2">
            <button type="button" className="font-semibold underline" onClick={() => run(true)}>
              Coba lagi
            </button>
            <button type="button" className="font-semibold underline" onClick={() => run(false)}>
              Cetak tanpa peta
            </button>
          </div>
        </div>
      )}
      {state.kind === 'done' && (
        <p role="status" className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
          {state.fileName} diunduh{state.withMap ? '' : ' (tanpa gambar peta)'}.
        </p>
      )}
    </div>
  );
}
