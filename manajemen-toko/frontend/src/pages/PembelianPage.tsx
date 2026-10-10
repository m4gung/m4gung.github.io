import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Phone, 
  MapPin, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Supplier, CreatePurchasePayload, Purchase } from '../types';

export const PembelianPage: React.FC = () => {
  const { 
    products, 
    suppliers, 
    purchases, 
    provider, 
    refreshData 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State: Create Purchase
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string>('');
  const [purchaseNo, setPurchaseNo] = useState<string>('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [purchaseDueDate, setPurchaseDueDate] = useState<string>('');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantity: number;
      costPrice: number;
      subtotal: number;
    }>
  >([]);

  // Modal State: Manage Suppliers
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<{
    name: string;
    phone: string;
    address: string;
  }>({
    name: '',
    phone: '',
    address: '',
  });

  // Modal State: View Purchase Detail
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate invoice number
  const openNewPurchaseModal = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPurchaseNo(`PO-${dateStr}-${rand}`);
    setPurchaseSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setPurchasePaymentMethod('CASH');
    setPurchaseDueDate('');
    setPurchaseNotes('');
    
    const defaultProduct = products.length > 0 ? products[0] : null;
    setPurchaseItems([
      {
        productId: defaultProduct ? defaultProduct.id : '',
        productName: defaultProduct ? defaultProduct.name : '',
        quantity: 1,
        costPrice: defaultProduct ? defaultProduct.costPrice : 0,
        subtotal: defaultProduct ? defaultProduct.costPrice : 0,
      },
    ]);
    setErrorMessage(null);
    setIsPurchaseModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProduct = products.length > 0 ? products[0] : null;
    setPurchaseItems([
      ...purchaseItems,
      {
        productId: defaultProduct ? defaultProduct.id : '',
        productName: defaultProduct ? defaultProduct.name : '',
        quantity: 1,
        costPrice: defaultProduct ? defaultProduct.costPrice : 0,
        subtotal: defaultProduct ? defaultProduct.costPrice : 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'costPrice', value: any) => {
    const updated = [...purchaseItems];
    const item = { ...updated[index] };

    if (field === 'productId') {
      item.productId = value;
      const found = products.find(p => p.id === value);
      if (found) {
        item.productName = found.name;
        item.costPrice = found.costPrice;
        item.subtotal = item.quantity * found.costPrice;
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value) || 1);
      item.quantity = qty;
      item.subtotal = qty * item.costPrice;
    } else if (field === 'costPrice') {
      const cost = Math.max(0, Number(value) || 0);
      item.costPrice = cost;
      item.subtotal = item.quantity * cost;
    }

    updated[index] = item;
    setPurchaseItems(updated);
  };

  const calculateGrandTotal = () => {
    return purchaseItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplierId) {
      setErrorMessage('Pilih mitra supplier terlebih dahulu.');
      return;
    }
    if (purchaseItems.length === 0) {
      setErrorMessage('Tambahkan minimal 1 barang untuk dibeli.');
      return;
    }
    if (purchasePaymentMethod === 'CREDIT' && !purchaseDueDate) {
      setErrorMessage('Untuk pembayaran tempo / kredit, wajib menentukan tanggal jatuh tempo.');
      return;
    }

    setLoadingAction(true);
    setErrorMessage(null);

    try {
      const supplier = suppliers.find(s => s.id === purchaseSupplierId);
      const supplierName = supplier ? supplier.name : 'Supplier Umum';
      const isCredit = purchasePaymentMethod === 'CREDIT';

      const payload: CreatePurchasePayload = {
        purchaseNo: purchaseNo || `PO-${Date.now()}`,
        supplierId: purchaseSupplierId,
        supplierName,
        paymentMethod: purchasePaymentMethod,
        paymentStatus: isCredit ? 'UNPAID' : 'PAID',
        dueDate: isCredit ? purchaseDueDate : undefined,
        notes: purchaseNotes || undefined,
        items: purchaseItems.map(item => ({
          productId: item.productId,
          productName: item.productName || 'Produk',
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
      };

      await provider.createPurchase(payload);
      await refreshData();
      setIsPurchaseModalOpen(false);
      setSuccessMessage('Transaksi pengadaan barang berhasil disimpan dan stok otomatis bertambah!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi pembelian.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Supplier CRUD
  const handleOpenSupplierModal = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      phone: '',
      address: '',
    });
    setErrorMessage(null);
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (supp: Supplier) => {
    setEditingSupplier(supp);
    setSupplierForm({
      name: supp.name,
      phone: supp.phone || '',
      address: supp.address || '',
    });
    setErrorMessage(null);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      setErrorMessage('Nama supplier wajib diisi.');
      return;
    }

    setLoadingAction(true);
    setErrorMessage(null);

    try {
      const supplierToSave: Supplier = {
        id: editingSupplier ? editingSupplier.id : `supp_${Date.now()}`,
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim(),
        address: supplierForm.address.trim(),
        isActive: true,
        createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
      };

      await provider.saveSupplier(supplierToSave);
      await refreshData();
      setEditingSupplier(null);
      setSupplierForm({
        name: '',
        phone: '',
        address: '',
      });
      setSuccessMessage('Data supplier berhasil disimpan!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data supplier.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus supplier ini?')) return;
    setLoadingAction(true);
    try {
      await provider.deleteSupplier(id);
      await refreshData();
      if (editingSupplier?.id === id) {
        setEditingSupplier(null);
      }
    } catch (err: any) {
      alert('Gagal menghapus supplier: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered Purchases
  const filteredPurchases = purchases.filter(p => {
    const suppName = (p.supplierName || '').toLowerCase();
    const purchaseNoStr = (p.purchaseNo || '').toLowerCase();
    const matchesSearch = 
      purchaseNoStr.includes(searchQuery.toLowerCase()) ||
      suppName.includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' || 
      p.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPengeluaran = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalBelumLunas = purchases
    .filter(p => p.paymentStatus === 'UNPAID')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const getMethodBadge = (method: 'CASH' | 'TRANSFER' | 'CREDIT') => {
    switch (method) {
      case 'CASH':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">TUNAI</span>;
      case 'TRANSFER':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">TRANSFER</span>;
      case 'CREDIT':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">TEMPO</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-brand-600" />
            Pengadaan & Pembelian (PO)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola faktur pembelian dari supplier, tambah stok otomatis, dan catat utang usaha.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenSupplierModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 text-gray-600" />
            Kelola Supplier ({suppliers.length})
          </button>
          <button
            onClick={openNewPurchaseModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            + Buat Pembelian Barang
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Transaksi</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{purchases.length}</p>
          <p className="text-xs text-gray-400 mt-1">Faktur pengadaan tersimpan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Belanja Barang</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Akumulasi pengeluaran stok</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Utang Belum Lunas</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            Rp {totalBelumLunas.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pembelian tempo / kredit usaha</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mitra Supplier</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Building2 className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{suppliers.length}</p>
          <p className="text-xs text-gray-400 mt-1">Vendor penyuplai aktif</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. faktur / supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Status Bayar:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">Lunas</option>
            <option value="UNPAID">Belum Lunas (Tempo)</option>
          </select>
        </div>
      </div>

      {/* Purchase List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Faktur / PO</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Total Biaya</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Belum ada data transaksi pembelian barang.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const isLunas = purchase.paymentStatus === 'PAID';

                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 font-mono text-xs">
                        {purchase.purchaseNo}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {new Date(purchase.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{purchase.supplierName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getMethodBadge(purchase.paymentMethod)}
                        {purchase.dueDate && (
                          <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Tempo: {new Date(purchase.dueDate).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                        Rp {purchase.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLunas
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isLunas ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Belum Lunas
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BUAT PEMBELIAN BARU */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Catat Pengadaan / Pembelian Barang
              </h2>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    No. Faktur / PO *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseNo}
                    onChange={(e) => setPurchaseNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mitra Supplier *
                  </label>
                  <select
                    required
                    value={purchaseSupplierId}
                    onChange={(e) => setPurchaseSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Metode Pembayaran *
                  </label>
                  <select
                    value={purchasePaymentMethod}
                    onChange={(e) => setPurchasePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    <option value="CASH">TUNAI (Kas Toko)</option>
                    <option value="TRANSFER">TRANSFER (Bank Toko)</option>
                    <option value="CREDIT">TEMPO / KREDIT (Utang Usaha)</option>
                  </select>
                </div>
              </div>

              {purchasePaymentMethod === 'CREDIT' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Jatuh Tempo Pembayaran Utang *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDueDate}
                    onChange={(e) => setPurchaseDueDate(e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white"
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    Transaksi ini akan dicatat ke Akun Utang Usaha (Liabilitas).
                  </p>
                </div>
              )}

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Daftar Barang Masuk
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Baris Barang
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50/50 flex flex-col sm:flex-row gap-3 items-center">
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Produk</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-500"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-24">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Qty Masuk</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-right font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Harga Beli Satuan</label>
                        <input
                          type="number"
                          min="0"
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-right font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-36 text-right">
                        <span className="block text-[10px] font-semibold text-gray-500 mb-0.5">Subtotal</span>
                        <span className="text-xs font-bold text-gray-900">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={purchaseItems.length === 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Notes */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengiriman via armada supplier..."
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="text-right w-full sm:w-auto">
                  <span className="text-xs text-gray-500 block">Total Pengadaan:</span>
                  <span className="text-xl font-black text-brand-700">
                    Rp {calculateGrandTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50"
                >
                  {loadingAction ? 'Menyimpan...' : 'Simpan & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KELOLA MASTER DATA SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-400" />
                Master Data Mitra Supplier
              </h2>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form Input Supplier */}
              <div className="lg:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-600" />
                  {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </h3>

                <form onSubmit={handleSaveSupplier} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Supplier *</label>
                    <input
                      type="text"
                      required
                      placeholder="PT / CV / Toko Agen..."
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Gudang / Kantor</label>
                    <textarea
                      rows={2}
                      placeholder="Alamat supplier..."
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingSupplier && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSupplier(null);
                          setSupplierForm({ name: '', phone: '', address: '' });
                        }}
                        className="flex-1 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white"
                      >
                        Batal Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow"
                    >
                      {editingSupplier ? 'Perbarui' : 'Simpan Supplier'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List Supplier Terdaftar */}
              <div className="lg:col-span-3 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Daftar Mitra ({suppliers.length})</h3>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {suppliers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      Belum ada data supplier. Tambahkan di formulir sebelah kiri.
                    </div>
                  ) : (
                    suppliers.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 bg-white rounded-xl border border-gray-200 hover:border-brand-300 flex justify-between items-start transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                          {s.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" /> {s.phone}
                            </div>
                          )}
                          {s.address && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" /> {s.address}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditSupplier(s)}
                            className="p-1 text-gray-400 hover:text-brand-600 rounded text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PEMBELIAN */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Faktur PO: {selectedPurchase.purchaseNo}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(selectedPurchase.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPurchase(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Supplier:</span>
                  <span className="font-bold text-gray-900">{selectedPurchase.supplierName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Metode Pembayaran:</span>
                  <span className="font-bold text-gray-900">{selectedPurchase.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status:</span>
                  <span className={`font-bold ${selectedPurchase.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedPurchase.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </div>
                {selectedPurchase.dueDate && (
                  <div>
                    <span className="text-gray-500 block">Jatuh Tempo:</span>
                    <span className="font-bold text-amber-700">
                      {new Date(selectedPurchase.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {selectedPurchase.notes && (
                <div className="text-xs bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-200">
                  <span className="font-semibold">Catatan:</span> {selectedPurchase.notes}
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                    <tr>
                      <th className="py-2 px-3">Barang</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga Beli</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPurchase.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">Rp {item.costPrice.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-sm">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right">Total:</td>
                      <td className="py-2.5 px-3 text-right text-brand-700">
                        Rp {selectedPurchase.totalAmount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
