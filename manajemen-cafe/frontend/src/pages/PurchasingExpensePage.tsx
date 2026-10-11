import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  Receipt,
  Plus,
  Search,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  X,
  Building,
  Filter
} from 'lucide-react';
import {
  db,
  processLocalPurchase,
  type LocalSupplier,
  type LocalPurchase,
  type LocalPurchaseItem,
  type LocalExpense,
  type LocalIngredient
} from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/receiptFormatter';

type SubTab = 'PURCHASES' | 'SUPPLIERS' | 'EXPENSES';

export const PurchasingExpensePage: React.FC = () => {
  const { activeOutlet } = useApp();
  const [activeTab, setActiveTab] = useState<SubTab>('PURCHASES');

  // Data states
  const [purchases, setPurchases] = useState<LocalPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Forms
  const [purchaseForm, setPurchaseForm] = useState<{
    supplierId: number | '';
    invoiceNumber: string;
    paymentStatus: 'PAID' | 'UNPAID';
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
    status: 'RECEIVED' | 'DRAFT';
    notes: string;
    items: Array<{
      ingredientId: number;
      quantity: number;
      unitCost: number;
    }>;
  }>({
    supplierId: '',
    invoiceNumber: '',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    status: 'RECEIVED',
    notes: '',
    items: []
  });

  const [supplierForm, setSupplierForm] = useState<LocalSupplier>({
    id: 0,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    isActive: true
  });
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);

  const [expenseForm, setExpenseForm] = useState<{
    category: string;
    description: string;
    amount: number;
    paymentMethod: 'CASH' | 'TRANSFER';
    receiptRef: string;
    recordedBy: string;
  }>({
    category: 'UTILITY',
    description: '',
    amount: 0,
    paymentMethod: 'CASH',
    receiptRef: '',
    recordedBy: 'Kasir/Owner'
  });

  const loadData = async () => {
    const allPurchases = await db.purchases.reverse().sortBy('purchaseDate');
    const allSuppliers = await db.suppliers.toArray();
    const allExpenses = await db.expenses.reverse().sortBy('expenseDate');
    const allIngredients = await db.ingredients.toArray();

    setPurchases(allPurchases);
    setSuppliers(allSuppliers);
    setExpenses(allExpenses);
    setIngredients(allIngredients);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= KPI CALCULATIONS =================
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalUnpaidPurchases = purchases
    .filter((p) => p.paymentStatus === 'UNPAID')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // ================= PURCHASE ACTIONS =================
  const handleOpenAddPurchase = () => {
    setPurchaseForm({
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      status: 'RECEIVED',
      notes: '',
      items: ingredients.length > 0 ? [{ ingredientId: ingredients[0].id, quantity: 10, unitCost: ingredients[0].costPerUnit }] : []
    });
    setIsPurchaseModalOpen(true);
  };

  const handleAddPurchaseItemRow = () => {
    if (ingredients.length === 0) return;
    setPurchaseForm({
      ...purchaseForm,
      items: [
        ...purchaseForm.items,
        { ingredientId: ingredients[0].id, quantity: 5, unitCost: ingredients[0].costPerUnit }
      ]
    });
  };

  const handleRemovePurchaseItemRow = (idx: number) => {
    const updated = [...purchaseForm.items];
    updated.splice(idx, 1);
    setPurchaseForm({ ...purchaseForm, items: updated });
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseForm.items.length === 0) {
      alert('Pilih minimal satu bahan baku untuk pembelian');
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === Number(purchaseForm.supplierId));
    let calculatedTotal = 0;

    const purchaseItems: LocalPurchaseItem[] = purchaseForm.items.map((it) => {
      const ing = ingredients.find((i) => i.id === it.ingredientId);
      const sub = Number(it.quantity) * Number(it.unitCost);
      calculatedTotal += sub;
      return {
        ingredientId: it.ingredientId,
        ingredientName: ing ? ing.name : 'Ingredient',
        unit: ing ? ing.unit : 'pcs',
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        subtotal: sub
      };
    });

    const newPurchase: LocalPurchase = {
      outletId: activeOutlet?.id || 1,
      supplierId: selectedSup ? selectedSup.id : undefined,
      supplierName: selectedSup ? selectedSup.name : 'Vendor Umum',
      invoiceNumber: purchaseForm.invoiceNumber,
      purchaseDate: new Date().toISOString(),
      totalAmount: calculatedTotal,
      paymentStatus: purchaseForm.paymentStatus,
      paymentMethod: purchaseForm.paymentMethod,
      status: purchaseForm.status,
      notes: purchaseForm.notes,
      items: purchaseItems,
      createdAt: new Date().toISOString()
    };

    await processLocalPurchase(newPurchase);
    setIsPurchaseModalOpen(false);
    await loadData();
  };

  // ================= SUPPLIER ACTIONS =================
  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierForm({
      id: 0,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      isActive: true
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (s: LocalSupplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({ ...s });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;

    if (editingSupplierId) {
      await db.suppliers.update(editingSupplierId, {
        name: supplierForm.name.trim(),
        contactPerson: supplierForm.contactPerson?.trim(),
        phone: supplierForm.phone?.trim(),
        email: supplierForm.email?.trim(),
        address: supplierForm.address?.trim(),
        isActive: supplierForm.isActive
      });
    } else {
      const nextId = (await db.suppliers.count()) > 0
        ? (await db.suppliers.orderBy('id').last())!.id + 1
        : 1;
      await db.suppliers.add({
        ...supplierForm,
        id: nextId
      });
    }

    setIsSupplierModalOpen(false);
    await loadData();
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm('Yakin ingin menghapus supplier ini?')) {
      await db.suppliers.delete(id);
      await loadData();
    }
  };

  // ================= EXPENSE ACTIONS =================
  const handleOpenAddExpense = () => {
    setExpenseForm({
      category: 'UTILITY',
      description: '',
      amount: 50000,
      paymentMethod: 'CASH',
      receiptRef: '',
      recordedBy: 'Kasir/Owner'
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || expenseForm.amount <= 0) return;

    const newExpense: LocalExpense = {
      outletId: activeOutlet?.id || 1,
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amount: Number(expenseForm.amount),
      paymentMethod: expenseForm.paymentMethod,
      expenseDate: new Date().toISOString(),
      receiptRef: expenseForm.receiptRef.trim(),
      recordedBy: expenseForm.recordedBy.trim(),
      createdAt: new Date().toISOString()
    };

    await db.expenses.add(newExpense);
    setIsExpenseModalOpen(false);
    await loadData();
  };

  const handleDeleteExpense = async (id?: number) => {
    if (id && confirm('Yakin ingin menghapus pengeluaran ini?')) {
      await db.expenses.delete(id);
      await loadData();
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
            <span>Pengadaan & Biaya Operasional</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Faktur pembelian bahan baku, manajemen vendor/supplier, dan pencatatan biaya operasional kafe.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'PURCHASES'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Pembelian Masuk</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'SUPPLIERS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Data Supplier</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'EXPENSES'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Biaya Operasional</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Pembelian Bahan</p>
            <h3 className="text-xl font-bold text-stone-900">{formatCurrency(totalPurchaseAmount)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className={`p-3 rounded-xl ${totalUnpaidPurchases > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Tagihan Belum Lunas (Hutang)</p>
            <h3 className={`text-xl font-bold ${totalUnpaidPurchases > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {formatCurrency(totalUnpaidPurchases)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Beban Operasional</p>
            <h3 className="text-xl font-bold text-blue-900">{formatCurrency(totalExpenseAmount)}</h3>
          </div>
        </div>
      </div>

      {/* TAB 1: PURCHASES */}
      {activeTab === 'PURCHASES' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nomor faktur atau nama supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={handleOpenAddPurchase}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Faktur Pembelian</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Item Pembelian</th>
                  <th className="py-3 px-3 text-right">Total Tagihan</th>
                  <th className="py-3 px-3 text-center">Status Bayar</th>
                  <th className="py-3 px-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Belum ada catatan faktur pembelian bahan baku.
                    </td>
                  </tr>
                ) : (
                  purchases
                    .filter((p) =>
                      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                          {new Date(p.purchaseDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-stone-900">
                          {p.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-800">
                          {p.supplierName || 'Vendor Umum'}
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          <span className="font-semibold text-stone-900">{p.items.length} jenis item:</span>{' '}
                          {p.items.map((i) => `${i.quantity} ${i.unit} ${i.ingredientName}`).join(', ')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {p.paymentStatus === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                              Belum Lunas
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                            {p.status === 'RECEIVED' ? 'Stok Masuk' : p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-600" />
              <span>Daftar Supplier & Vendor Kafe</span>
            </h3>

            <button
              onClick={handleOpenAddSupplier}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{s.name}</h4>
                      {s.contactPerson && (
                        <p className="text-xs text-stone-500 mt-0.5">PIC: {s.contactPerson}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditSupplier(s)}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(s.id)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 mt-3">
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{s.phone}</span>
                        <a
                          href={`https://wa.me/${s.phone.replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 hover:underline font-semibold"
                        >
                          (Chat WA)
                        </a>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                        <span className="text-[11px] leading-tight">{s.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL EXPENSES */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Semua Kategori Beban</option>
                <option value="UTILITY">Utilitas (Listrik, Air, Gas, WiFi)</option>
                <option value="SALARY">Gaji & Upah Karyawan</option>
                <option value="RENT">Sewa Bangunan/Tempat</option>
                <option value="MAINTENANCE">Perawatan & Reparasi Mesin</option>
                <option value="MARKETING">Pemasaran & Promosi</option>
                <option value="SUPPLIES">Perlengkapan & Kebersihan</option>
                <option value="OTHER">Lain-lain</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddExpense}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran Operasional</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Deskripsi / Keperluan</th>
                  <th className="py-3 px-3 text-right">Nominal Biaya</th>
                  <th className="py-3 px-3 text-center">Metode Bayar</th>
                  <th className="py-3 px-3">Dicatat Oleh</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Belum ada catatan pengeluaran operasional.
                    </td>
                  </tr>
                ) : (
                  expenses
                    .filter((e) => (expenseCategoryFilter ? e.category === expenseCategoryFilter : true))
                    .map((e, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                          {new Date(e.expenseDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-900">
                          {e.description}
                          {e.receiptRef && (
                            <span className="block text-[10px] text-stone-400 font-mono">
                              Ref: {e.receiptRef}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] text-stone-600">
                          {e.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-stone-500 text-[11px]">
                          {e.recordedBy || 'Admin'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: FAKTUR PEMBELIAN BARU */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">Catat Faktur Pembelian Bahan Baku</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pilih Supplier / Vendor</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Vendor Bebas / Non-Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nomor Faktur / Nota</label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Status Pembayaran</label>
                  <select
                    value={purchaseForm.paymentStatus}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PAID">Lunas (PAID)</option>
                    <option value="UNPAID">Belum Lunas / Hutang Usaha (UNPAID)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={purchaseForm.paymentMethod}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CASH">Kas / Tunai</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CREDIT">Tempo / Kredit</option>
                  </select>
                </div>
              </div>

              {/* Purchase items list */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800">Daftar Bahan Yang Dibeli</label>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItemRow}
                    className="text-amber-600 hover:text-amber-800 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahan</span>
                  </button>
                </div>

                {purchaseForm.items.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <select
                      value={row.ingredientId}
                      onChange={(e) => {
                        const updated = [...purchaseForm.items];
                        const ing = ingredients.find((i) => i.id === Number(e.target.value));
                        updated[idx].ingredientId = Number(e.target.value);
                        if (ing) updated[idx].unitCost = ing.costPerUnit;
                        setPurchaseForm({ ...purchaseForm, items: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white text-xs"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <div className="w-20">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        required
                        value={row.quantity}
                        onChange={(e) => {
                          const updated = [...purchaseForm.items];
                          updated[idx].quantity = Number(e.target.value);
                          setPurchaseForm({ ...purchaseForm, items: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        placeholder="Harga Beli"
                        required
                        value={row.unitCost}
                        onChange={(e) => {
                          const updated = [...purchaseForm.items];
                          updated[idx].unitCost = Number(e.target.value);
                          setPurchaseForm({ ...purchaseForm, items: updated });
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePurchaseItemRow(idx)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pengiriman batch pagi via kurir..."
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Faktur & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH / EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingSupplierId ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Perusahaan / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Kopi Harapan Nusantara"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Contact Person (PIC)</label>
                <input
                  type="text"
                  placeholder="Nama kontak sales..."
                  value={supplierForm.contactPerson || ''}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={supplierForm.phone || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={supplierForm.email || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Alamat Gudang / Kantor</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap supplier..."
                  value={supplierForm.address || ''}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CATAT PENGELUARAN */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">Catat Biaya Pengeluaran Operasional</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Kategori Pengeluaran</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="UTILITY">Utilitas (Listrik PLN, Air PDAM, Gas, WiFi)</option>
                  <option value="SALARY">Gaji & Upah Karyawan / Barista</option>
                  <option value="RENT">Sewa Bangunan & Tempat Usaha</option>
                  <option value="MAINTENANCE">Perawatan / Service Mesin Kopi</option>
                  <option value="MARKETING">Pemasaran, Brosur & Iklan Medsos</option>
                  <option value="SUPPLIES">Perlengkapan Bar, Tissue & Kebersihan</option>
                  <option value="OTHER">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi / Keperluan Biaya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli token listrik PLN 200rb, Bayar galon air..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nominal Biaya (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Metode Bayar</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CASH">Kas / Tunai</option>
                    <option value="TRANSFER">Transfer Bank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">No. Bukti / Struk (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: STRUK-091"
                    value={expenseForm.receiptRef}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptRef: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dicatat Oleh</label>
                  <input
                    type="text"
                    value={expenseForm.recordedBy}
                    onChange={(e) => setExpenseForm({ ...expenseForm, recordedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
