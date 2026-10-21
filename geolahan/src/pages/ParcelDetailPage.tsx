import { useState } from 'react';
import { FileJson } from 'lucide-react';
import { downloadText, geoJsonFileName, serializeGeoJson } from '../features/export/export.service';
import { PrintReportControl } from '../components/report/PrintReportControl';
import {
  ArrowLeft,
  Map as MapIcon,
  Trash2,
  Edit,
  Copy,
  Check,
  Calendar,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router';
import { Card, PageContainer } from '../components/layout/PageContainer';
import { useParcel, useParcels } from '../features/parcels/useParcels';
import { useMeasurement } from '../features/measurement/useMeasurement';
import { formatNumberId, formatCoord } from '../features/measurement/geometry.service';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { SaveParcelModal } from '../components/parcels/SaveParcelModal';
import type { ParcelColor } from '../features/measurement/measurement.types';

export function ParcelDetailPage() {
  const { parcelId } = useParams();
  const navigate = useNavigate();
  const { parcel, isLoading } = useParcel(parcelId);
  const { deleteParcel, updateParcel } = useParcels();
  const { setLoadedParcelId } = useMeasurement();

  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <PageContainer title="Memuat Data Lahan...">
        <div className="py-20 text-center text-sm text-slate-500">Memuat rincian lahan dari database lokal...</div>
      </PageContainer>
    );
  }

  if (!parcel) {
    return (
      <PageContainer title="Lahan Tidak Ditemukan">
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bidang tanah dengan ID <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{parcelId}</code> tidak ditemukan di database.
          </p>
          <Link to="/lahan" className="btn-secondary text-xs px-3 py-2 mt-4 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" /> Kembali ke Daftar Lahan
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const handleOpenOnMap = () => {
    setLoadedParcelId(parcel.id);
    navigate('/peta');
  };

  const handleDelete = async () => {
    await deleteParcel(parcel.id);
    navigate('/lahan');
  };

  const handleUpdate = async (data: {
    name: string;
    owner?: string;
    description?: string;
    color: ParcelColor;
    measuredAt: string;
    measurementMethod: 'map_digitization' | 'gps_mobile' | 'combined';
    notes?: string;
  }) => {
    await updateParcel(parcel.id, data);
    setIsEditing(false);
  };

  const copyCoordinates = async () => {
    const text = parcel.controlPoints
      .map((cp) => `${cp.label}: Lat ${formatCoord(cp.latitude)}, Lon ${formatCoord(cp.longitude)} (Jarak: ${formatNumberId(cp.distanceToNextM)}m)`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Ekspor CSV Titik Koordinat Patok
  const exportCsv = () => {
    const header = 'Nomor Patok,Latitude,Longitude,Jarak ke Patok Berikutnya (meter)\n';
    const rows = parcel.controlPoints
      .map((cp) => `"${cp.label}",${formatCoord(cp.latitude)},${formatCoord(cp.longitude)},${cp.distanceToNextM.toFixed(2)}`)
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koordinat-patok-${parcel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title={parcel.name}
      description={`Pengukuran dilakukan pada ${parcel.measuredAt}`}
    >
      {/* Tombol Navigasi & Aksi Utama */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link to="/lahan" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="size-4" /> Kembali ke Daftar Lahan
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenOnMap}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <MapIcon className="size-4" />
            <span>Tampilkan di Peta</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Edit className="size-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleting(true)}
            className="p-2 rounded-xl text-red-500 border border-slate-200 hover:bg-red-50 dark:border-slate-800 dark:hover:bg-red-950/40"
            title="Hapus Lahan"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Grid Ringkasan Informasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 sm:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Identitas &amp; Informasi Bidang
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nama Bidang</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{parcel.name}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Pemilik / Hak</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <User className="size-3 text-slate-400" /> {parcel.owner || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tanggal Pengukuran</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="size-3 text-slate-400" /> {parcel.measuredAt}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Metode</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {parcel.measurementMethod === 'map_digitization'
                  ? 'Digitasi Peta Satelit'
                  : parcel.measurementMethod === 'gps_mobile'
                    ? 'GPS Lapangan'
                    : 'Kombinasi'}
              </span>
            </div>
          </div>

          {parcel.description && (
            <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Keterangan</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{parcel.description}</p>
            </div>
          )}

          {parcel.notes && (
            <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Catatan Akurasi</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{parcel.notes}</p>
            </div>
          )}
        </Card>

        {/* Metrik Geometri */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Perhitungan Geometri
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Luas (m²):</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatNumberId(parcel.areaM2)} m²</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Luas (Are):</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatNumberId(parcel.areaAre)} Are</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Luas (Hektare):</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatNumberId(parcel.areaHa, 4)} Ha</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400">Keliling Batas:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumberId(parcel.perimeterM)} m</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400">Centroid:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {formatCoord(parcel.centroid[0])}, {formatCoord(parcel.centroid[1])}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabel Koordinat Titik Patok */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tabel Koordinat Patok ({parcel.controlPoints.length} Titik)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sistem Koordinat Geografis WGS 84 (Derajat Desimal 6 Angka)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyCoordinates}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
              title="Unduh file CSV koordinat patok"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={() => downloadText(geoJsonFileName([parcel]), serializeGeoJson([parcel]), 'application/geo+json')}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
              title="Unduh file GeoJSON lahan"
            >
              <FileJson className="size-3.5" />
              <span>Ekspor GeoJSON</span>
            </button>
            <PrintReportControl parcel={parcel} compact />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2 font-semibold">No. Patok</th>
                <th className="px-3 py-2 font-semibold">Latitude</th>
                <th className="px-3 py-2 font-semibold">Longitude</th>
                <th className="px-3 py-2 font-semibold text-right">Jarak ke Titik Berikutnya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {parcel.controlPoints.map((cp) => (
                <tr key={cp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                    {cp.label}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                    {formatCoord(cp.latitude)}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                    {formatCoord(cp.longitude)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400 font-medium">
                    {formatNumberId(cp.distanceToNextM)} m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={isDeleting}
        title="Hapus Bidang Lahan"
        message={`Apakah Anda yakin ingin menghapus bidang tanah "${parcel.name}"? Data yang terhapus dari browser tidak dapat dipulihkan.`}
        confirmLabel="Hapus Data"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsDeleting(false)}
      />

      {/* Modal Edit Metadata */}
      {isEditing && (
        <SaveParcelModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleUpdate}
          existingParcel={parcel}
        />
      )}
    </PageContainer>
  );
}
