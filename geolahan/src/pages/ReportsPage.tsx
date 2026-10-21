import { FileJson, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '../components/common/EmptyState';
import { Card, PageContainer } from '../components/layout/PageContainer';
import { DataTransferPanel } from '../components/backup/DataTransferPanel';
import { PrintReportControl } from '../components/report/PrintReportControl';
import { useParcels } from '../features/parcels/useParcels';
import { downloadText, geoJsonFileName, serializeGeoJson } from '../features/export/export.service';
import { formatNumberId } from '../features/measurement/geometry.service';

export function ReportsPage() {
  const { parcels, isLoading } = useParcels();

  return (
    <PageContainer title="Laporan" description="Cetak laporan PDF A4, ekspor GeoJSON, serta backup dan restore data lahan.">
      <div className="space-y-6">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Ekspor, Impor &amp; Backup</h2>
          <DataTransferPanel parcels={parcels} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Data tersimpan hanya di browser ini (IndexedDB). Backup JSON adalah berkas lokal, bukan backup cloud.
          </p>
        </Card>

        <Card>
          {!isLoading && parcels.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada lahan untuk dilaporkan"
              description="Ukur dan simpan bidang lahan di halaman Peta, lalu cetak laporannya di sini."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="Daftar lahan untuk laporan">
              {parcels.map((p) => (
                <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link to={`/lahan/${p.id}`} className="font-medium text-slate-900 hover:text-emerald-600 dark:text-white">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatNumberId(p.areaM2)} m² • {p.owner || 'Tanpa pemilik'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      title={`Ekspor GeoJSON ${p.name}`}
                      onClick={() => downloadText(geoJsonFileName([p]), serializeGeoJson([p]), 'application/geo+json')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <FileJson className="size-4" aria-hidden="true" /> GeoJSON
                    </button>
                    <PrintReportControl parcel={p} compact />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
