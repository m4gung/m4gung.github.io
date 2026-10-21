import { useRef, useState, type ChangeEvent } from 'react';
import { DatabaseBackup, Download, FileJson, Upload } from 'lucide-react';
import { db } from '../../db/database';
import {
  applyRestore,
  backupFileName,
  createBackup,
  parseBackup,
  planRestore,
  type ParsedBackup,
  type RestoreResult,
  type RestoreStrategy,
} from '../../features/backup/backup.service';
import {
  MAX_IMPORT_BYTES,
  downloadText,
  buildFeatureCollection,
  parseGeoJson,
  todayStamp,
} from '../../features/export/export.service';
import { parcelRepository } from '../../features/parcels/parcel.repository';
import type { Parcel } from '../../features/parcels/parcel.types';

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

async function readFile(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Berkas terlalu besar (maksimal 10 MB).');
  return await file.text();
}

export function DataTransferPanel({ parcels }: { parcels: Parcel[] }) {
  const backupInput = useRef<HTMLInputElement>(null);
  const geoInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ parsed: ParsedBackup; conflicts: number } | null>(null);
  const [strategy, setStrategy] = useState<RestoreStrategy>('merge');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string; details?: string[] } | null>(null);

  const exportAll = () => downloadText(`geolahan-semua-lahan-${todayStamp()}.geojson`, JSON.stringify(buildFeatureCollection(parcels), null, 2), 'application/geo+json');

  const doBackup = async () => {
    const all = await parcelRepository.getAll();
    downloadText(backupFileName(), JSON.stringify(createBackup(all), null, 2), 'application/json');
    setMessage({ type: 'ok', text: `Backup ${all.length} lahan diunduh. Simpan berkasnya sendiri; ini bukan backup cloud.` });
  };

  const onBackupFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    setPending(null);
    try {
      const parsed = parseBackup(await readFile(file));
      const ids = new Set((await db.parcels.toCollection().primaryKeys()) as string[]);
      setPending({ parsed, conflicts: planRestore(parsed.parcels, ids).conflicts });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Berkas backup tidak dapat dibaca.' });
    }
  };

  const confirmRestore = async () => {
    if (!pending) return;
    try {
      const r: RestoreResult = await applyRestore(pending.parsed.parcels, strategy);
      setMessage({
        type: 'ok',
        text: `Restore selesai: ${r.added} ditambahkan, ${r.replaced} ditimpa, ${r.skipped} dilewati.`,
        details: pending.parsed.errors.length ? pending.parsed.errors : undefined,
      });
    } catch (err) {
      setMessage({ type: 'error', text: `Restore gagal, data lama tidak diubah: ${err instanceof Error ? err.message : ''}` });
    }
    setPending(null);
  };

  const onGeoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      const { inputs, errors } = parseGeoJson(await readFile(file));
      for (const input of inputs) await parcelRepository.create(input);
      setMessage({
        type: inputs.length ? 'ok' : 'error',
        text: `${inputs.length} lahan diimpor dari GeoJSON${errors.length ? `, ${errors.length} fitur dilewati` : ''}.`,
        details: errors.length ? errors : undefined,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'GeoJSON tidak dapat diimpor.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={exportAll} disabled={parcels.length === 0}>
          <FileJson className="size-4" aria-hidden="true" /> Ekspor Semua GeoJSON
        </button>
        <button type="button" className={btn} onClick={() => geoInput.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> Impor GeoJSON
        </button>
        <button type="button" className={btn} onClick={doBackup} disabled={parcels.length === 0}>
          <Download className="size-4" aria-hidden="true" /> Backup JSON
        </button>
        <button type="button" className={btn} onClick={() => backupInput.current?.click()}>
          <DatabaseBackup className="size-4" aria-hidden="true" /> Restore Backup
        </button>
        <input ref={geoInput} type="file" accept=".geojson,.json,application/geo+json,application/json" className="hidden" aria-label="Pilih berkas GeoJSON" onChange={onGeoFile} />
        <input ref={backupInput} type="file" accept=".json,application/json" className="hidden" aria-label="Pilih berkas backup" onChange={onBackupFile} />
      </div>

      {pending && (
        <div role="dialog" aria-label="Konfirmasi restore" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-slate-100">
          <p>
            Berkas valid: <strong>{pending.parsed.parcels.length}</strong> lahan akan diimpor,{' '}
            <strong>{pending.conflicts}</strong> ID bentrok dengan data saat ini
            {pending.parsed.errors.length > 0 && <>, <strong>{pending.parsed.errors.length}</strong> record rusak dilewati</>}.
          </p>
          <fieldset className="mt-2 space-y-1 text-xs">
            <legend className="sr-only">Strategi restore</legend>
            {(
              [
                ['merge', 'Gabungkan (bentrok disimpan sebagai salinan baru)'],
                ['skip', 'Lewati duplikat'],
                ['replace', 'Ganti data yang bentrok'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="restore-strategy" checked={strategy === value} onChange={() => setStrategy(value)} /> {label}
              </label>
            ))}
          </fieldset>
          <div className="mt-3 flex gap-2">
            <button type="button" className={btn} onClick={confirmRestore}>
              Terapkan Restore
            </button>
            <button type="button" className={btn} onClick={() => setPending(null)}>
              Batal
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'}`}
        >
          <p>{message.text}</p>
          {message.details && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {message.details.slice(0, 10).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
