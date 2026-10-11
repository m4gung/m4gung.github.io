import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah, formatPhoneWA } from '../services/utils';
import { Users, Plus, Edit2, Trash2, Phone, MessageSquare, Search, X } from 'lucide-react';
import type { Customer } from '../types';

export const CustomersPage: React.FC = () => {
  const { showToast } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [haircutNotes, setHaircutNotes] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await db.customers.toArray();
      setCustomers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setHaircutNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setHaircutNotes(c.haircutNotes);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama pelanggan wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = editingCustomer ? editingCustomer.id : 'cst_' + Date.now();
      const customerData: Customer = {
        id,
        name: name.trim(),
        phone: phone.trim(),
        haircutNotes: haircutNotes.trim(),
        totalVisits: editingCustomer ? editingCustomer.totalVisits : 0,
        totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
        lastVisitAt: editingCustomer?.lastVisitAt,
        createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString()
      };

      await db.customers.put(customerData);
      await loadCustomers();
      setIsModalOpen(false);
      showToast(editingCustomer ? 'Data pelanggan berhasil diubah' : 'Pelanggan baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (confirm(`Yakin ingin menghapus data pelanggan "${customerName}"?`)) {
      try {
        await db.customers.delete(id);
        await loadCustomers();
        showToast('Data pelanggan berhasil dihapus', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  };

  const handleOpenChat = (rawPhone: string, customerName: string) => {
    if (!rawPhone) {
      showToast('Nomor WhatsApp tidak tersedia', 'error');
      return;
    }
    const clean = formatPhoneWA(rawPhone);
    const greeting = encodeURIComponent(`Halo Bpk/Sdr ${customerName}, salam hangat dari Gentlemen Classic Barbershop! 🙏✂️`);
    window.open(`https://wa.me/${clean}?text=${greeting}`, '_blank');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.haircutNotes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Database Pelanggan & Preferensi Gaya Rambut
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pencatatan riwayat kunjungan, preferensi potongan rambut, dan kontak WhatsApp pelanggan.
          </p>
        </div>

        <Button variant="gold" onClick={openAddModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari pelanggan berdasarkan nama, nomor HP, atau gaya rambut..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Tidak ada data pelanggan yang cocok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(c => (
            <div
              key={c.id}
              className="p-5 rounded-2xl border bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-neutral-100 text-sm">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                    <Phone className="w-3 h-3 text-neutral-500" />
                    <span>{c.phone || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {c.phone && (
                    <button
                      onClick={() => handleOpenChat(c.phone, c.name)}
                      title="Hubungi via WhatsApp"
                      className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Haircut Notes */}
              <div className="p-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs">
                <span className="text-[10px] font-semibold text-amber-500 block mb-0.5">
                  Catatan Preferensi Potongan:
                </span>
                <p className="text-neutral-300 italic">
                  {c.haircutNotes || 'Belum ada catatan preferensi gaya rambut.'}
                </p>
              </div>

              {/* Visit Stats */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <div>
                  Kunjungan: <strong className="text-neutral-200">{c.totalVisits} kali</strong>
                </div>
                <div>
                  Total Belanja: <strong className="text-emerald-400">{formatRupiah(c.totalSpent)}</strong>
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
                {editingCustomer ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru'}
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
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nama Lengkap Pelanggan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Rian Hidayat"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nomor WhatsApp / HP:</label>
                <input
                  type="tel"
                  placeholder="081234567890 (Digunakan untuk kirim struk WA)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Catatan Preferensi Gaya Rambut (Haircut Notes):
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Samping 1.5 fade halus, atas disisakan 5 cm, pomade water-based..."
                  value={haircutNotes}
                  onChange={e => setHaircutNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
