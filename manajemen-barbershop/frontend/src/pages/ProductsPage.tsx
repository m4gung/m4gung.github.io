import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import { Package, Plus, Edit2, Trash2, AlertTriangle, ArrowUpDown, X } from 'lucide-react';
import type { ProductItem } from '../types';

export const ProductsPage: React.FC = () => {
  const { showToast } = useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Styling');
  const [costPrice, setCostPrice] = useState(40000);
  const [sellingPrice, setSellingPrice] = useState(65000);
  const [stock, setStock] = useState(10);
  const [minStockAlert, setMinStockAlert] = useState(3);
  const [isActive, setIsActive] = useState(true);

  // Restock Quick Modal
  const [restockProduct, setRestockProduct] = useState<ProductItem | null>(null);
  const [addStockQty, setAddStockQty] = useState(5);

  const categories = ['Semua', 'Styling', 'Care', 'Treatment', 'Tools'];

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await db.products.toArray();
      setProducts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setSku('PRD-' + Math.floor(100 + Math.random() * 900));
    setName('');
    setCategory('Styling');
    setCostPrice(40000);
    setSellingPrice(65000);
    setStock(10);
    setMinStockAlert(3);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }
    if (sellingPrice <= costPrice) {
      if (!confirm('Harga jual lebih kecil atau sama dengan harga modal (HPP). Lanjutkan?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const id = editingProduct ? editingProduct.id : 'prd_' + Date.now();
      const productData: ProductItem = {
        id,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        costPrice,
        sellingPrice,
        stock,
        minStockAlert,
        isActive,
        updatedAt: new Date().toISOString()
      };

      await db.products.put(productData);
      await loadProducts();
      setIsModalOpen(false);
      showToast(editingProduct ? 'Produk berhasil diubah' : 'Produk baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    if (addStockQty <= 0) {
      showToast('Jumlah restock harus lebih dari 0', 'error');
      return;
    }

    try {
      const newStock = restockProduct.stock + addStockQty;
      await db.products.update(restockProduct.id, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      });
      await loadProducts();
      setRestockProduct(null);
      showToast(`Stok ${restockProduct.name} bertambah +${addStockQty} (Total: ${newStock})`, 'success');
    } catch (err: any) {
      showToast('Gagal menambah stok: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (confirm(`Yakin ingin menghapus produk retail "${productName}"?`)) {
      try {
        await db.products.delete(id);
        await loadProducts();
        showToast('Produk berhasil dihapus', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  };

  const filteredProducts = selectedCategory === 'Semua'
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Manajemen Produk Retail (Pomade, Clay, Tonic)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kelola stok barang, harga modal (HPP), harga jual, margin keuntungan, dan restock.
          </p>
        </div>

        <Button variant="gold" onClick={openAddModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Produk
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

      {/* Product List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <Package className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Belum ada produk dalam kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const isLowStock = p.stock <= p.minStockAlert;
            const profitMargin = p.sellingPrice - p.costPrice;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all ${
                  p.isActive
                    ? 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/60 border-neutral-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                        {p.sku}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-neutral-100 text-sm mt-1.5">{p.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRestockProduct(p)}
                      title="Tambah Stok / Restock"
                      className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stock Indicator */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Sisa Stok:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                        p.stock === 0
                          ? 'bg-rose-500/20 text-rose-400'
                          : isLowStock
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {p.stock} pcs
                    </span>
                    {isLowStock && (
                      <span title="Stok Menipis!">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    Laba: <span className="text-emerald-400 font-semibold">{formatRupiah(profitMargin)}</span>
                  </div>
                </div>

                {/* Prices */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">HPP (Modal):</span>
                    <span className="text-neutral-300 font-medium">{formatRupiah(p.costPrice)}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-neutral-500 text-[10px] block">Harga Jual:</span>
                    <span className="text-base font-extrabold text-neutral-100">{formatRupiah(p.sellingPrice)}</span>
                  </div>
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
                {editingProduct ? 'Ubah Produk Retail' : 'Tambah Produk Retail Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">SKU / Kode:</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-mono uppercase focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Kategori:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Styling">Styling (Pomade/Clay)</option>
                    <option value="Care">Care (Tonic/Shampoo)</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Tools">Tools / Aksesoris</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Oil-Based Heavy Hold 100g"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Harga Modal (HPP):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={costPrice}
                    onChange={e => setCostPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Harga Jual:</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Stok Awal (Pcs):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Batas Alert Stok Sedikit:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-1 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-950 border-neutral-800"
                />
                <span>Produk Aktif (Tampil di kasir)</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-100">
              Restock: {restockProduct.name}
            </h3>
            <p className="text-xs text-neutral-400">
              Stok saat ini: <strong className="text-amber-400">{restockProduct.stock} pcs</strong>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Jumlah Tambah Stok (Pcs):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addStockQty}
                  onChange={e => setAddStockQty(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-base font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setRestockProduct(null)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold">
                  Konfirmasi Restock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
