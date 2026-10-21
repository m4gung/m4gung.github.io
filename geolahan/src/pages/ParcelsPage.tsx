import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  LandPlot,
  Map as MapIcon,
  Trash2,
  Edit,
  Eye,
  Calendar,
  User,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Card, PageContainer } from '../components/layout/PageContainer';
import { useParcels } from '../features/parcels/useParcels';
import { useMeasurement } from '../features/measurement/useMeasurement';
import { formatNumberId } from '../features/measurement/geometry.service';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { SaveParcelModal } from '../components/parcels/SaveParcelModal';
import type { Parcel } from '../features/parcels/parcel.types';
import type { ParcelColor } from '../features/measurement/measurement.types';

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name_asc';

export function ParcelsPage() {
  const { parcels, deleteParcel, updateParcel } = useParcels();
  const { setLoadedParcelId } = useMeasurement();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // State untuk dialog konfirmasi hapus
  const [deletingParcel, setDeletingParcel] = useState<Parcel | null>(null);

  // State untuk modal edit metadata
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);

  // Ambil daftar unik pemilik lahan untuk filter
  const uniqueOwners = useMemo(() => {
    const set = new Set<string>();
    parcels.forEach((p) => {
      if (p.owner) set.add(p.owner);
    });
    return Array.from(set);
  }, [parcels]);

  // Filter & Urutkan
  const filteredParcels = useMemo(() => {
    return parcels
      .filter((p) => {
        const matchesQuery =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.owner && p.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesOwner = selectedOwner === 'ALL' || p.owner === selectedOwner;

        return matchesQuery && matchesOwner;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'largest') return b.areaM2 - a.areaM2;
        if (sortBy === 'smallest') return a.areaM2 - b.areaM2;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [parcels, searchQuery, selectedOwner, sortBy]);

  const handleOpenOnMap = (id: string) => {
    setLoadedParcelId(id);
    navigate('/peta');
  };

  const handleConfirmDelete = async () => {
    if (!deletingParcel) return;
    await deleteParcel(deletingParcel.id);
    setDeletingParcel(null);
  };

  const handleUpdateParcel = async (data: {
    name: string;
    owner?: string;
    description?: string;
    color: ParcelColor;
    measuredAt: string;
    measurementMethod: 'map_digitization' | 'gps_mobile' | 'combined';
    notes?: string;
  }) => {
    if (!editingParcel) return;
    await updateParcel(editingParcel.id, data);
    setEditingParcel(null);
  };

  return (
    <PageContainer
      title="Daftar Lahan"
      description="Kelola, cari, filter, dan buka kembali bidang tanah yang telah Anda ukur."
    >
      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama lahan, pemilik, atau keterangan..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pemilik */}
          {uniqueOwners.length > 0 && (
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">Semua Pemilik</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          )}

          {/* Urutan */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
            <SlidersHorizontal className="size-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-200"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="largest">Luas Terbesar</option>
              <option value="smallest">Luas Terkecil</option>
              <option value="name_asc">Nama (A-Z)</option>
            </select>
          </div>

          <Link to="/peta" className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
            <Plus className="size-4" />
            <span>Ukur Baru</span>
          </Link>
        </div>
      </div>

      {/* Daftar Kartu Lahan */}
      {parcels.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-3">
            <LandPlot className="size-7" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Belum ada bidang tanah yang disimpan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Buka peta satelit interaktif, gunakan tombol Ukur Lahan untuk menggambar poligon, lalu simpan ke database lokal Anda.
          </p>
          <Link to="/peta" className="btn-primary text-xs px-4 py-2">
            <MapIcon className="size-4" /> Mulai Pengukuran Lahan
          </Link>
        </Card>
      ) : filteredParcels.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tidak ada bidang tanah yang sesuai dengan kata kunci pencarian.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedOwner('ALL');
            }}
            className="text-xs text-emerald-600 font-semibold mt-2 hover:underline dark:text-emerald-400"
          >
            Bersihkan Filter
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredParcels.map((parcel) => (
            <Card key={parcel.id} className="p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-4 rounded-full shrink-0"
                      style={{ backgroundColor: parcel.color }}
                    />
                    <Link
                      to={`/lahan/${parcel.id}`}
                      className="text-base font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {parcel.name}
                    </Link>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {formatNumberId(parcel.areaM2)} m²
                  </span>
                </div>

                {parcel.description && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {parcel.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {parcel.owner && (
                    <span className="flex items-center gap-1">
                      <User className="size-3" /> {parcel.owner}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" /> {parcel.measuredAt}
                  </span>
                  <span>{formatNumberId(parcel.areaHa, 4)} Ha</span>
                  <span>{parcel.controlPoints.length} Patok</span>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => handleOpenOnMap(parcel.id)}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  title="Tampilkan poligon di peta"
                >
                  <MapIcon className="size-3.5" />
                  <span>Buka di Peta</span>
                </button>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/lahan/${parcel.id}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Lihat Detail & Titik Patok"
                  >
                    <Eye className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditingParcel(parcel)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Edit Metadata Lahan"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingParcel(parcel)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    title="Hapus Lahan"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deletingParcel)}
        title="Hapus Bidang Lahan"
        message={`Apakah Anda yakin ingin menghapus bidang tanah "${deletingParcel?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Data"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingParcel(null)}
      />

      {/* Modal Edit Metadata */}
      {editingParcel && (
        <SaveParcelModal
          isOpen={Boolean(editingParcel)}
          onClose={() => setEditingParcel(null)}
          onSave={handleUpdateParcel}
          existingParcel={editingParcel}
        />
      )}
    </PageContainer>
  );
}
