import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Store, Plus, Edit2, Trash2, MapPin, Phone, User, CheckCircle2, X } from 'lucide-react';
import type { Branch } from '../types';

export const BranchesPage: React.FC = () => {
  const { showToast, activeBranch, setActiveBranchId, reloadBranches } = useApp();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await db.branches.toArray();
      setBranches(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingBranch(null);
    setCode('CB-0' + (branches.length + 1));
    setName('');
    setAddress('');
    setPhone('');
    setManagerName('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setCode(b.code);
    setName(b.name);
    setAddress(b.address);
    setPhone(b.phone);
    setManagerName(b.managerName || '');
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama cabang toko wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = editingBranch ? editingBranch.id : 'brn_' + Date.now();
      const branchData: Branch = {
        id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        managerName: managerName.trim(),
        isActive,
        createdAt: editingBranch ? editingBranch.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.branches.put(branchData);
      await loadData();
      await reloadBranches();
      setIsModalOpen(false);
      showToast(editingBranch ? 'Data cabang berhasil diubah' : 'Cabang baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, branchName: string) => {
    if (branches.length <= 1) {
      showToast('Minimal harus ada 1 cabang toko', 'error');
      return;
    }

    if (confirm(`Yakin ingin menghapus data cabang "${branchName}"?`)) {
      try {
        await db.branches.delete(id);
        await loadData();
        await reloadBranches();
        showToast('Cabang berhasil dihapus', 'success');
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
            <Store className="w-5 h-5 text-amber-500" />
            Manajemen Cabang Toko (Multi-Outlet)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kelola daftar outlet/cabang barbershop, alamat, kontak cabang, dan penanggung jawab.
          </p>
        </div>

        <Button variant="gold" onClick={openAddModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Cabang
        </Button>
      </div>

      {/* Grid Cabang */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map(n => (
            <div key={n} className="h-44 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => {
            const isCurrentActive = activeBranch?.id === b.id;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isCurrentActive
                    ? 'bg-neutral-900/90 border-amber-500/60 shadow-lg shadow-amber-950/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Cabang Aktif
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-neutral-100 text-base mt-1.5">{b.name}</h3>
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

                <div className="space-y-2 text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-300">{b.address || 'Alamat belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{b.phone || '-'}</span>
                  </div>
                  {b.managerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>PJ: <strong className="text-neutral-200">{b.managerName}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {!isCurrentActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setActiveBranchId(b.id)}
                    >
                      Pilih Sebagai Cabang Aktif
                    </Button>
                  ) : (
                    <div className="text-center py-1 text-xs text-amber-400 font-semibold bg-amber-500/10 rounded-xl border border-amber-500/20">
                      Sedang Digunakan di Kasir
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Ubah Cabang */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                {editingBranch ? 'Ubah Data Cabang' : 'Tambah Cabang Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Kode Cabang:</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 font-mono uppercase focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nama Cabang / Outlet:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Cabang Panakkukang"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Alamat Outlet Cabang:</label>
                <input
                  type="text"
                  placeholder="Jl. Pengayoman Ruko No. 12"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">No. Telp / WA Cabang:</label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Penanggung Jawab (PJ):</label>
                  <input
                    type="text"
                    placeholder="Nama Manajer Cabang"
                    value={managerName}
                    onChange={e => setManagerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  {editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
