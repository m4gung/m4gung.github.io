import React, { useState, useEffect } from 'react';
import {
  Coffee,
  FolderTree,
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Search,
  Armchair
} from 'lucide-react';
import { db, type LocalProduct, type LocalCategory, type LocalModifier, type LocalTable } from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/receiptFormatter';
import { syncManager } from '../api/syncManager';

type MasterTab = 'PRODUCTS' | 'CATEGORIES' | 'MODIFIERS' | 'TABLES';

export const MenuPage: React.FC = () => {
  const { activeOutlet } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<MasterTab>('PRODUCTS');
  
  // Data States
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [modifiers, setModifiers] = useState<LocalModifier[]>([]);
  const [tables, setTables] = useState<LocalTable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Form Edit States
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);
  const [editingCategory, setEditingCategory] = useState<LocalCategory | null>(null);
  const [editingModifier, setEditingModifier] = useState<LocalModifier | null>(null);
  const [editingTable, setEditingTable] = useState<LocalTable | null>(null);

  // Form Fields
  const [prodName, setProdName] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(20000);
  const [prodCategory, setProdCategory] = useState<number>(1);
  const [prodDesc, setProdDesc] = useState('');

  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState<number>(1);

  const [modName, setModName] = useState('');
  const [modPrice, setModPrice] = useState<number>(5000);

  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState<number>(4);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAllMasterData = async () => {
    const prods = await db.products.toArray();
    const cats = await db.categories.toArray();
    const mods = await db.modifiers.toArray();
    const tbls = await db.diningTables.toArray();

    setProducts(prods);
    setCategories(cats);
    setModifiers(mods);
    setTables(tbls);
  };

  useEffect(() => {
    loadAllMasterData();
  }, [activeOutlet]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ================= PRODUCT CRUD =================
  const handleOpenProductModal = (prod?: LocalProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdCode(prod.code || '');
      setProdPrice(prod.basePrice);
      setProdCategory(prod.categoryId || 1);
      setProdDesc(prod.description || '');
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCode(`MENU-${Date.now().toString().slice(-4)}`);
      setProdPrice(20000);
      setProdCategory(categories[0]?.id || 1);
      setProdDesc('');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const id = editingProduct ? editingProduct.id : Date.now();
    const productData: LocalProduct = {
      id,
      outletId: activeOutlet?.id || 1,
      categoryId: prodCategory,
      name: prodName.trim(),
      code: prodCode.trim(),
      description: prodDesc.trim(),
      basePrice: prodPrice,
      isActive: true
    };

    await db.products.put(productData);
    await syncManager.queueItem('MENU', editingProduct ? 'UPDATE' : 'CREATE', productData);
    await loadAllMasterData();
    setIsProductModalOpen(false);
    showToast('Produk menu berhasil disimpan!');
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    await db.products.delete(id);
    await syncManager.queueItem('MENU', 'DELETE', { id });
    await loadAllMasterData();
    showToast('Produk menu berhasil dihapus');
  };

  // ================= CATEGORY CRUD =================
  const handleOpenCategoryModal = (cat?: LocalCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatOrder(cat.sortOrder);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatOrder(categories.length + 1);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const id = editingCategory ? editingCategory.id : Date.now();
    const catData: LocalCategory = {
      id,
      outletId: activeOutlet?.id || 1,
      name: catName.trim(),
      sortOrder: catOrder,
      isActive: true
    };

    await db.categories.put(catData);
    await loadAllMasterData();
    setIsCategoryModalOpen(false);
    showToast('Kategori berhasil disimpan!');
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    await db.categories.delete(id);
    await loadAllMasterData();
    showToast('Kategori berhasil dihapus');
  };

  // ================= MODIFIER CRUD =================
  const handleOpenModifierModal = (mod?: LocalModifier) => {
    if (mod) {
      setEditingModifier(mod);
      setModName(mod.name);
      setModPrice(mod.price);
    } else {
      setEditingModifier(null);
      setModName('');
      setModPrice(5000);
    }
    setIsModifierModalOpen(true);
  };

  const handleSaveModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName.trim()) return;

    const id = editingModifier ? editingModifier.id : Date.now();
    const modData: LocalModifier = {
      id,
      name: modName.trim(),
      price: modPrice
    };

    await db.modifiers.put(modData);
    await loadAllMasterData();
    setIsModifierModalOpen(false);
    showToast('Modifier berhasil disimpan!');
  };

  const handleDeleteModifier = async (id: number) => {
    if (!confirm('Hapus modifier ini?')) return;
    await db.modifiers.delete(id);
    await loadAllMasterData();
    showToast('Modifier dihapus');
  };

  // ================= TABLE CRUD =================
  const handleOpenTableModal = (tbl?: LocalTable) => {
    if (tbl) {
      setEditingTable(tbl);
      setTableNumber(tbl.tableNumber);
      setTableCapacity(tbl.capacity);
    } else {
      setEditingTable(null);
      setTableNumber(`Meja ${tables.length + 1 < 10 ? '0' + (tables.length + 1) : tables.length + 1}`);
      setTableCapacity(4);
    }
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    const id = editingTable ? editingTable.id : Date.now();
    const tableData: LocalTable = {
      id,
      outletId: activeOutlet?.id || 1,
      tableNumber: tableNumber.trim(),
      capacity: tableCapacity,
      status: 'AVAILABLE'
    };

    await db.diningTables.put(tableData);
    await loadAllMasterData();
    setIsTableModalOpen(false);
    showToast('Meja berhasil disimpan!');
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('Hapus meja ini?')) return;
    await db.diningTables.delete(id);
    await loadAllMasterData();
    showToast('Meja dihapus');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Master Data Café</h2>
          <p className="text-xs text-stone-500">
            Kelola menu produk, kategori, modifier/tambahan, dan meja dine-in cabang {activeOutlet?.name}.
          </p>
        </div>

        {toastMessage && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </span>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('PRODUCTS')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'PRODUCTS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Menu Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CATEGORIES')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'CATEGORIES'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MODIFIERS')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'MODIFIERS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Modifier & Opsi ({modifiers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TABLES')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'TABLES'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Armchair className="w-4 h-4" />
          <span>Meja Kafe ({tables.length})</span>
        </button>
      </div>

      {/* 1. PRODUCTS TAB */}
      {activeSubTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama menu atau kode SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => handleOpenProductModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Menu</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Harga Dasar</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    return (
                      <tr key={p.id} className="hover:bg-stone-50 transition">
                        <td className="p-3 font-mono text-[11px] font-semibold text-stone-500">
                          {p.code || '-'}
                        </td>
                        <td className="p-3 font-semibold text-stone-900">{p.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium text-[11px]">
                            {cat ? cat.name : 'Umum'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-stone-900">
                          {formatCurrency(p.basePrice)}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES TAB */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-stone-500">Kategori menentukan pengelompokan tab di kasir POS.</p>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{c.name}</h4>
                  <span className="text-[11px] text-stone-400">Urutan: #{c.sortOrder}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenCategoryModal(c)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MODIFIERS TAB */}
      {activeSubTab === 'MODIFIERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-stone-500">Modifier adalah opsi tambahan opsional seperti Extra Shot, Gula, atau Topping.</p>
            <button
              onClick={() => handleOpenModifierModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Modifier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {modifiers.map((m) => (
              <div
                key={m.id}
                className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{m.name}</h4>
                  <span className="text-xs font-semibold text-amber-700">+{formatCurrency(m.price)}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModifierModal(m)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteModifier(m.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TABLES TAB */}
      {activeSubTab === 'TABLES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-stone-500">Daftar meja dine-in yang dapat dipilih kasir saat membuat pesanan.</p>
            <button
              onClick={() => handleOpenTableModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Meja</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-stone-900 text-sm">{t.tableNumber}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">Kapasitas: {t.capacity} Orang</p>
                </div>

                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => handleOpenTableModal(t)}
                    className="p-1 rounded hover:bg-stone-100 text-stone-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(t.id)}
                    className="p-1 rounded hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingProduct ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400 hover:text-stone-700" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Susu Pandan"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kode / SKU:</label>
                  <input
                    type="text"
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Harga Dasar (Rp):</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori:</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  placeholder="Catatan bahan atau rasa..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Kategori:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Signature Coffee"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nomor Urutan:</label>
                <input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODIFIER MODAL */}
      {isModifierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingModifier ? 'Edit Modifier' : 'Tambah Modifier'}
              </h3>
              <button onClick={() => setIsModifierModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveModifier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Opsi / Modifier:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Extra Shot Espresso"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Harga Tambahan (Rp):</label>
                <input
                  type="number"
                  value={modPrice}
                  onChange={(e) => setModPrice(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModifierModalOpen(false)}
                  className="flex-1 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                >
                  Simpan Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
              </h3>
              <button onClick={() => setIsTableModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nomor / Nama Meja:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 05 atau VIP 2"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kapasitas (Kursi):</label>
                <input
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="flex-1 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                >
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
