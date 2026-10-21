import { useState, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import type { MeasurementResult, ParcelColor } from '../../features/measurement/measurement.types';
import { PARCEL_COLORS } from '../../features/measurement/measurement.types';
import type { MeasurementMethod, Parcel } from '../../features/parcels/parcel.types';
import { formatNumberId } from '../../features/measurement/geometry.service';

interface SaveParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    owner?: string;
    description?: string;
    color: ParcelColor;
    measuredAt: string;
    measurementMethod: MeasurementMethod;
    notes?: string;
  }) => Promise<void>;
  measurement?: MeasurementResult | null;
  existingParcel?: Parcel | null;
  /** Metode pengukuran bawaan untuk lahan baru (mis. 'gps_mobile' dari lintasan GPS). */
  defaultMethod?: MeasurementMethod;
}

export function SaveParcelModal({
  isOpen,
  onClose,
  onSave,
  measurement,
  existingParcel,
  defaultMethod,
}: SaveParcelModalProps) {
  const [name, setName] = useState(existingParcel?.name || '');
  const [owner, setOwner] = useState(existingParcel?.owner || '');
  const [description, setDescription] = useState(existingParcel?.description || '');
  const [color, setColor] = useState<ParcelColor>(existingParcel?.color || PARCEL_COLORS[0]!.hex);
  const [measuredAt, setMeasuredAt] = useState(
    existingParcel?.measuredAt || new Date().toISOString().split('T')[0]!,
  );
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>(
    existingParcel?.measurementMethod || defaultMethod || 'map_digitization',
  );
  const [notes, setNotes] = useState(existingParcel?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama bidang lahan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        owner: owner.trim() || undefined,
        description: description.trim() || undefined,
        color,
        measuredAt,
        measurementMethod,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data lahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-parcel-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id="save-parcel-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {existingParcel ? 'Edit Informasi Lahan' : 'Simpan Pengukuran Lahan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Tutup form"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Konten Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Ringkasan Geometri */}
          {measurement && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs grid grid-cols-3 gap-2 text-center dark:bg-slate-800/60">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Luas</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumberId(measurement.areaM2)} m²
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Keliling</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumberId(measurement.perimeterM)} m
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Patok</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {measurement.controlPoints.length} Titik
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="parcel-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lahan <span className="text-red-500">*</span>
            </label>
            <input
              id="parcel-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kebun Sawit Blok A, Tanah Rumah"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="parcel-owner" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Pemilik
              </label>
              <input
                id="parcel-owner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Nama pemilik / pemegang hak"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="parcel-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pengukuran
              </label>
              <input
                id="parcel-date"
                type="date"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="parcel-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pengukuran
              </label>
              <select
                id="parcel-method"
                value={measurementMethod}
                onChange={(e) => setMeasurementMethod(e.target.value as MeasurementMethod)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="map_digitization">Digitasi Peta Satelit</option>
                <option value="gps_mobile">Titik GPS Lapangan</option>
                <option value="combined">Kombinasi Peta &amp; GPS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warna Poligon
              </label>
              <div className="flex items-center gap-2 pt-1">
                {PARCEL_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c.hex ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="parcel-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Lahan
            </label>
            <textarea
              id="parcel-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Peruntukan lahan, batas utara/selatan, dsb."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="parcel-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Kondisi &amp; Akurasi
            </label>
            <input
              id="parcel-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi cuaca, batas fisik patok, galat estimasi"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Save className="size-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Lahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
