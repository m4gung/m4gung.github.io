import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import { UserCheck, Plus, Edit2, Trash2, Phone, Calendar, X } from 'lucide-react';
import type { Barber } from '../types';

export const BarbersPage: React.FC = () => {
  const { showToast, settings } = useApp();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionType, setCommissionType] = useState<'DEFAULT' | 'PERCENTAGE' | 'FIXED'>('DEFAULT');
  const [commissionValue, setCommissionValue] = useState(0);
  const [dailyMealAllowance, setDailyMealAllowance] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  const loadBarbers = async () => {
    setIsLoading(true);
    try {
      const data = await db.barbers.toArray();
      setBarbers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBarbers();
  }, []);

  const openAddModal = () => {
    setEditingBarber(null);
    setName('');
    setPhone('');
    setCommissionType('DEFAULT');
    setCommissionValue(0);
    setDailyMealAllowance(0);
    setIsActive(true);
    setJoinDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Barber) => {
    setEditingBarber(b);
    setName(b.name);
    setPhone(b.phone);
    setCommissionType(b.commissionType);
    setCommissionValue(b.commissionValue);
    setDailyMealAllowance(b.dailyMealAllowance);
    setIsActive(b.isActive);
    setJoinDate(b.joinDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama barber tidak boleh kosong', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = editingBarber ? editingBarber.id : 'brb_' + Date.now();
      const barberData: Barber = {
        id,
        name: name.trim(),
        phone: phone.trim(),
        commissionType,
        commissionValue: commissionType === 'DEFAULT' ? 0 : commissionValue,
        dailyMealAllowance,
        isActive,
        joinDate,
        updatedAt: new Date().toISOString()
      };

      await db.barbers.put(barberData);
      await loadBarbers();
      setIsModalOpen(false);
      showToast(editingBarber ? 'Data barber berhasil diubah' : 'Barber baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, barberName: string) => {
    if (confirm(`Yakin ingin menghapus data barber "${barberName}"?`)) {
      try {
        await db.barbers.delete(id);
        await loadBarbers();
        showToast('Data barber berhasil dihapus', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            Manajemen Barber & Skema Komisi
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kelola data barber / kapster, nomor kontak, skema komisi khusus, dan uang makan harian.
          </p>
        </div>

        <Button variant="gold" onClick={openAddModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Barber
        </Button>
      </div>

      {/* Barber Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <UserCheck className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Belum ada data barber.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map(b => {
            const isUsingDefault = b.commissionType === 'DEFAULT';
            const commissionText = isUsingDefault
              ? `Default Toko (${settings?.defaultCommissionValue || 35}% ${settings?.defaultCommissionType === 'PERCENTAGE' ? '%' : 'Rp'})`
              : b.commissionType === 'PERCENTAGE'
              ? `${b.commissionValue}% per layanan`
              : `${formatRupiah(b.commissionValue)} per layanan`;

            const mealAllowanceText = b.dailyMealAllowance > 0
              ? formatRupiah(b.dailyMealAllowance)
              : `${formatRupiah(settings?.defaultDailyMealAllowance || 20000)} (Default Toko)`;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all ${
                  b.isActive
                    ? 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/60 border-neutral-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-100 text-sm">{b.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-500" />
                        <span>{b.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Skema Komisi:</span>
                    <span className="font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {commissionText}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Uang Makan / Hari:</span>
                    <span className="font-medium text-emerald-400">
                      {mealAllowanceText}
                    </span>
                  </div>

                  {b.joinDate && (
                    <div className="flex justify-between items-center text-neutral-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Bergabung:
                      </span>
                      <span>{b.joinDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                {editingBarber ? 'Ubah Data Barber' : 'Tambah Barber Baru'}
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
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nama Lengkap Barber:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Tanggal Bergabung:</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={e => setJoinDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Skema Komisi Barber:</label>
                <select
                  value={commissionType}
                  onChange={e => setCommissionType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="DEFAULT">Ikuti Aturan Global Toko ({settings?.defaultCommissionValue || 35}%)</option>
                  <option value="PERCENTAGE">Kustom Persentase (%) Khusus Barber Ini</option>
                  <option value="FIXED">Kustom Nominal Tetap (Rp) per Layanan</option>
                </select>
              </div>

              {commissionType !== 'DEFAULT' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    {commissionType === 'PERCENTAGE' ? 'Nilai Komisi (%):' : 'Nominal Komisi per Layanan (Rp):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={commissionValue}
                    onChange={e => setCommissionValue(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Uang Makan Harian Khusus (Rp) - Opsional:
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="0 jika ikuti aturan global toko"
                  value={dailyMealAllowance}
                  onChange={e => setDailyMealAllowance(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Kosongkan/isi 0 untuk memakai nilai default toko ({formatRupiah(settings?.defaultDailyMealAllowance || 20000)}/hari).
                </span>
              </div>

              <label className="flex items-center gap-2.5 pt-1 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-950 border-neutral-800"
                />
                <span>Barber Aktif Bekerja (Tampil di kasir POS & absensi)</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  {editingBarber ? 'Simpan Perubahan' : 'Tambah Barber'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
