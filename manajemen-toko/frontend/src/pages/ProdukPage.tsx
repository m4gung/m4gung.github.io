import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  History, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  TrendingUp, 
  ArrowUpDown
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { Product, StockMutation } from '../types';

export const ProdukPage: React.FC = () => {
  const { products, categories, provider, refreshData } = useStore();

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // State Modal Produk (Tambah / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // State Modal Penyesuaian Stok
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<'KOREKSI_OPNAME' | 'RUSAK' | 'HILANG' | 'SALAH_INPUT' | 'LAINNYA'>('KOREKSI_OPNAME');
  const [adjustNotes, setAdjustNotes] = useState('');

  // State Modal Kartu Stok (Mutasi)
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationsList, setMutationsList] = useState<StockMutation[]>([]);
  const [selectedProductForMutation, setSelectedProductForMutation] = useState<Product | null>(null);

  // State Modal Kelola Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // State Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filter Data Produk
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchLowStock = !onlyLowStock || p.stock <= p.minStock;

    return matchSearch && matchCategory && matchLowStock;
  });

  // Handler Buka Form Tambah Produk
  const handleOpenAddProduct = () => {
    const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
    setEditingProduct({
      sku: randomSku,
      barcode: '',
      name: '',
      category: categories.length > 0 ? categories[0].name : 'Umum',
      unit: 'Pcs',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 5
    });
    setIsProductModalOpen(true);
  };

  // Handler Buka Form Edit Produk
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  // Handler Simpan Produk
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.sku) {
      setFeedback({ type: 'error', text: 'Nama produk dan SKU wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      await provider.saveProduct(editingProduct);
      await refreshData();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setFeedback({ type: 'success', text: `Produk "${editingProduct.name}" berhasil disimpan!` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Gagal menyimpan produk: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Hapus Produk
  const handleDeleteProduct = async (prod: Product) => {
    if (!confirm(`Yakin ingin menghapus/mengarsipkan produk "${prod.name}"?`)) return;
    try {
      await provider.deleteProduct(prod.id);
      await refreshData();
      setFeedback({ type: 'success', text: `Produk "${prod.name}" berhasil dihapus!` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Gagal menghapus produk: ${err.message}` });
    }
  };

  // Handler Buka Modal Penyesuaian Stok
  const handleOpenAdjustStock = (prod: Product) => {
    setAdjustTarget(prod);
    setNewStockValue(prod.stock);
    setAdjustReason('KOREKSI_OPNAME');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  // Handler Eksekusi Penyesuaian Stok
  const handleExecuteAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    if (newStockValue < 0) {
      alert('Stok tidak boleh bernilai negatif!');
      return;
    }

    setSubmitting(true);
    try {
      await provider.adjustStock({
        productId: adjustTarget.id,
        newStock: newStockValue,
        reason: adjustReason,
        notes: adjustNotes
      });
      await refreshData();
      setIsAdjustModalOpen(false);
      setAdjustTarget(null);
      setFeedback({ type: 'success', text: `Stok "${adjustTarget.name}" berhasil diperbarui menjadi ${newStockValue} ${adjustTarget.unit}!` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Gagal menyesuaikan stok: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Buka Kartu Stok / Mutasi
  const handleOpenMutations = async (prod?: Product) => {
    try {
      setSelectedProductForMutation(prod || null);
      const list = await provider.getStockMutations(prod ? prod.id : undefined);
      setMutationsList(list);
      setIsMutationModalOpen(true);
    } catch (err: any) {
      alert('Gagal memuat kartu stok: ' + err.message);
    }
  };

  // Handler Tambah Kategori
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await provider.saveCategory({ name: newCategoryName.trim() });
      await refreshData();
      setNewCategoryName('');
      setFeedback({ type: 'success', text: `Kategori "${newCategoryName}" berhasil ditambahkan!` });
    } catch (err: any) {
      alert('Gagal menambah kategori: ' + err.message);
    }
  };

  // Handler Hapus Kategori
  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await provider.deleteCategory(catId);
      await refreshData();
    } catch (err: any) {
      alert('Gagal menghapus kategori: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk & Persediaan</h2>
          <p className="text-sm text-gray-600">
            Kelola katalog barang, pantau mutasi kartu stok, dan lakukan penyesuaian stok opname.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            Kelola Kategori
          </button>
          <button
            onClick={() => handleOpenMutations()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <History className="w-4 h-4 text-brand-600" />
            Riwayat Mutasi Stok
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Bar Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input Cari */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, SKU, atau barcode..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Dropdown Kategori & Filter Stok */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyLowStock
                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Stok Kritis Saja
          </button>
        </div>
      </div>

      {/* Tabel Produk */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            Menampilkan {filteredProducts.length} dari {products.length} Produk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">SKU & Barcode</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Beli</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-center">Stok</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    Tidak ada produk yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const marginRp = p.sellingPrice - p.costPrice;
                  const marginPct = p.costPrice > 0 ? ((marginRp / p.costPrice) * 100).toFixed(0) : '0';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        <div className="font-semibold text-gray-800">{p.sku || '-'}</div>
                        <div className="text-[10px] text-gray-400">{p.barcode || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[11px] text-gray-400">Satuan: {p.unit}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatRupiah(p.costPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-700">{formatRupiah(p.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <TrendingUp className="w-3 h-3" />
                          {marginPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={`text-sm ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </span>
                        <div className="text-[10px] text-gray-400 font-normal">Min: {p.minStock}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Stok Rendah
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Sesuaikan Stok"
                            onClick={() => handleOpenAdjustStock(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            title="Riwayat Kartu Stok"
                            onClick={() => handleOpenMutations(p)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Produk"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Produk"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: FORM TAMBAH / EDIT PRODUK */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct.id ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Contoh: Beras Ramos 5kg / Indomie Goreng"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Kode Barang *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Barcode (Opsional)</label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    placeholder="Scan atau input barcode EAN"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category || 'Umum'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'Pcs'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="Pcs / Bks / Btl / Kg / Liter"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Beli / Modal (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.costPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.sellingPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold text-brand-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batas Minimum Peringatan Stok</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.minStock || 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM PENYESUAIAN STOK (STOCK ADJUSTMENT) */}
      {isAdjustModalOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Penyesuaian Stok (Stock Opname)</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustStock} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500">Produk yang disesuaikan:</div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">{adjustTarget.name}</div>
                <div className="text-xs text-gray-600 mt-1 flex justify-between">
                  <span>Stok di Sistem: <strong>{adjustTarget.stock} {adjustTarget.unit}</strong></span>
                  <span>SKU: {adjustTarget.sku}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Stok Fisik Aktual Baru *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Selisih mutasi: <strong className={newStockValue - adjustTarget.stock >= 0 ? 'text-green-600' : 'text-rose-600'}>
                    {newStockValue - adjustTarget.stock >= 0 ? `+${newStockValue - adjustTarget.stock}` : `${newStockValue - adjustTarget.stock}`} {adjustTarget.unit}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Penyesuaian *</label>
                <select
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                >
                  <option value="KOREKSI_OPNAME">Koreksi Stok Opname (Hitung Fisik)</option>
                  <option value="RUSAK">Barang Rusak / Kedaluwarsa</option>
                  <option value="HILANG">Barang Hilang / Selisih Kasir</option>
                  <option value="SALAH_INPUT">Koreksi Salah Input Sebelumnya</option>
                  <option value="LAINNYA">Alasan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Keterangan pendukung audit penyesuaian..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Terapkan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RIWAYAT KARTU STOK / MUTASI */}
      {isMutationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Kartu Mutasi Stok {selectedProductForMutation ? `- ${selectedProductForMutation.name}` : '(Semua Produk)'}
                </h3>
                <p className="text-xs text-gray-500">Catatan audit riwayat keluar-masuk barang</p>
              </div>
              <button
                onClick={() => setIsMutationModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Waktu</th>
                    <th className="px-3 py-2">Produk</th>
                    <th className="px-3 py-2">Tipe</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2">No. Referensi</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {mutationsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        Belum ada mutasi stok tercatat.
                      </td>
                    </tr>
                  ) : (
                    mutationsList.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/80">
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatTanggal(m.date)}</td>
                        <td className="px-3 py-2 font-medium">{m.productName}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.type === 'OUT_SALE'
                                ? 'bg-rose-50 text-rose-700'
                                : m.type === 'IN_PURCHASE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          <span className={m.quantity >= 0 ? 'text-green-600' : 'text-rose-600'}>
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-500 text-[11px]">{m.referenceNo || '-'}</td>
                        <td className="px-3 py-2 text-gray-600 text-[11px]">{m.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsMutationModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KELOLA KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Kelola Kategori Produk</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Tambah
              </button>
            </form>

            {/* List Kategori */}
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
