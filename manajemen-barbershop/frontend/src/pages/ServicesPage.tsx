import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import { Scissors, Plus, Edit2, Trash2, Clock, X } from 'lucide-react';
import type { ServiceItem } from '../types';

export const ServicesPage: React.FC = () => {
  const { showToast } = useApp();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Haircut');
  const [price, setPrice] = useState(45000);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isActive, setIsActive] = useState(true);

  const categories = ['Semua', 'Haircut', 'Shaving', 'Treatment', 'Coloring', 'Paket'];

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await db.services.toArray();
      setServices(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategory('Haircut');
    setPrice(45000);
    setDurationMinutes(30);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category);
    setPrice(srv.price);
    setDurationMinutes(srv.durationMinutes);
    setIsActive(srv.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama layanan tidak boleh kosong', 'error');
      return;
    }
    if (price <= 0) {
      showToast('Harga layanan harus lebih dari Rp 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = editingService ? editingService.id : 'srv_' + Date.now();
      const serviceData: ServiceItem = {
        id,
        name: name.trim(),
        category,
        price,
        durationMinutes,
        isActive,
        updatedAt: new Date().toISOString()
      };

      await db.services.put(serviceData);
      await loadServices();
      setIsModalOpen(false);
      showToast(editingService ? 'Layanan berhasil diubah' : 'Layanan baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    if (confirm(`Yakin ingin menghapus layanan "${serviceName}"?`)) {
      try {
        await db.services.delete(id);
        await loadServices();
        showToast('Layanan berhasil dihapus', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  };

  const filteredServices = selectedCategory === 'Semua'
    ? services
    : services.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-500" />
            Manajemen Layanan Cukur & Perawatan
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kelola daftar layanan potong rambut, shaving, coloring, dan paket perawatan barbershop.
          </p>
        </div>

        <Button variant="gold" onClick={openAddModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Layanan
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <Scissors className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Belum ada layanan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(srv => (
            <div
              key={srv.id}
              className={`p-4 rounded-2xl border transition-all ${
                srv.isActive
                  ? 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                  : 'bg-neutral-950/60 border-neutral-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {srv.category}
                  </span>
                  <h3 className="font-bold text-neutral-100 text-sm mt-1.5">{srv.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(srv.id, srv.name)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{srv.durationMinutes} menit</span>
                </div>

                <div className="text-base font-extrabold text-neutral-100">
                  {formatRupiah(srv.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                {editingService ? 'Ubah Layanan' : 'Tambah Layanan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nama Layanan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gentleman Haircut"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Kategori:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Haircut">Haircut</option>
                    <option value="Shaving">Shaving</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Coloring">Coloring</option>
                    <option value="Paket">Paket</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Durasi (Menit):</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Harga (Rp):</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-950 border-neutral-800"
                />
                <span>Layanan Aktif (Bisa dipilih di Kasir)</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  {editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
