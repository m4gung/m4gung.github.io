import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Edit3,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Percent,
  RefreshCw,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../context/useStore';
import { formatRupiah, formatTanggal, formatThousand, parseThousand } from '../utils/format';
import { exportToCsv } from '../utils/exportCsv';
import type { CheckoutPayload } from '../adapters/IDataProvider';
import type { PaymentMethod, Sale } from '../types';

type FilterMode = 'today' | 'month' | 'range' | 'all';

interface EditItemRow {
  productId: string;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

export const LaporanPage: React.FC = () => {
  const { provider, products, customers, refreshData } = useStore();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit Modal state
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editItems, setEditItems] = useState<EditItemRow[]>([]);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('CASH');
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editCashReceived, setEditCashReceived] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [addProductId, setAddProductId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSales = async () => {
    setLoading(true);
    try {
      const history = await provider.getSalesHistory();
      setSales(history);
    } catch (err) {
      console.error('Gagal memuat laporan transaksi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [provider]);

  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const q = searchQuery.trim().toLowerCase();

    return sales.filter((s) => {
      const datePart = (s.date || '').slice(0, 10);
      if (filterMode === 'today' && datePart !== todayStr) return false;
      if (filterMode === 'month' && !datePart.startsWith(selectedMonth)) return false;
      if (filterMode === 'range') {
        if (startDate && datePart < startDate) return false;
        if (endDate && datePart > endDate) return false;
      }

      if (paymentFilter !== 'ALL' && s.paymentMethod !== paymentFilter) return false;

      if (q) {
        const matchInvoice = s.invoiceNo.toLowerCase().includes(q);
        const matchCustomer = (s.customerName || '').toLowerCase().includes(q);
        const matchItem = (s.items || []).some((it) => it.productName.toLowerCase().includes(q));
        if (!matchInvoice && !matchCustomer && !matchItem) return false;
      }

      return true;
    });
  }, [sales, filterMode, selectedMonth, startDate, endDate, paymentFilter, searchQuery]);

  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCost = 0;

    for (const s of filteredSales) {
      totalRevenue += Number(s.finalAmount || 0);
      totalDiscount += Number(s.discount || 0);
      for (const it of s.items || []) {
        totalCost += Number(it.costPrice || 0) * Number(it.quantity || 0);
      }
    }

    return {
      count: filteredSales.length,
      totalRevenue,
      totalDiscount,
      estimatedProfit: totalRevenue - totalCost,
    };
  }, [filteredSales]);

  const handleExportFilteredCsv = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data transaksi pada filter saat ini untuk diekspor.');
      return;
    }

    const suffix =
      filterMode === 'today'
        ? new Date().toISOString().slice(0, 10)
        : filterMode === 'month'
          ? selectedMonth
          : filterMode === 'range'
            ? `${startDate}_sd_${endDate}`
            : 'semua';

    exportToCsv(
      `Laporan_Transaksi_${suffix}.csv`,
      ['No Faktur', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Status', 'Subtotal', 'Diskon', 'Total Akhir', 'Rincian Barang', 'Catatan'],
      filteredSales.map((s) => [
        s.invoiceNo,
        formatTanggal(s.date),
        s.customerName || 'Pelanggan Umum',
        s.paymentMethod,
        s.paymentStatus,
        s.totalAmount,
        s.discount,
        s.finalAmount,
        (s.items || []).map((it) => `${it.productName} x${it.quantity}`).join(' | '),
        s.notes || '',
      ])
    );
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditItems(
      (sale.items || []).map((it) => ({
        productId: it.productId,
        productName: it.productName,
        costPrice: Number(it.costPrice || 0),
        sellingPrice: Number(it.sellingPrice || 0),
        quantity: Number(it.quantity || 1),
      }))
    );
    setEditDiscount(Number(sale.discount || 0));
    setEditPaymentMethod(sale.paymentMethod);
    setEditCustomerId(sale.customerId || '');
    setEditCashReceived(Number(sale.cashReceived || 0));
    setEditNotes(sale.notes || '');
    setAddProductId('');
    setFeedback(null);
  };

  const editSubtotal = editItems.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0);
  const editFinalTotal = Math.max(0, editSubtotal - editDiscount);

  const handleAddProductToEdit = () => {
    if (!addProductId) return;
    const prod = products.find((p) => p.id === addProductId);
    if (!prod) return;

    setEditItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === prod.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          quantity: 1,
        },
      ];
    });
    setAddProductId('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (editItems.length === 0) {
      setFeedback({ type: 'error', text: 'Transaksi minimal harus memiliki 1 barang.' });
      return;
    }
    if (!provider.updateSale) {
      setFeedback({ type: 'error', text: 'Mode penyimpanan saat ini belum mendukung edit transaksi.' });
      return;
    }
    if (editPaymentMethod === 'CASH' && editCashReceived < editFinalTotal) {
      setFeedback({ type: 'error', text: 'Uang tunai diterima kurang dari total tagihan baru.' });
      return;
    }
    if (editPaymentMethod === 'CREDIT' && !editCustomerId) {
      setFeedback({ type: 'error', text: 'Pembayaran tempo/kredit wajib memilih pelanggan.' });
      return;
    }

    setSavingEdit(true);
    setFeedback(null);
    try {
      const selectedCust = customers.find((c) => c.id === editCustomerId);
      const isCredit = editPaymentMethod === 'CREDIT';
      const isCash = editPaymentMethod === 'CASH';

      const payload: CheckoutPayload = {
        invoiceNo: editingSale.invoiceNo,
        customerId: selectedCust?.id,
        customerName: selectedCust?.name || 'Pelanggan Umum',
        totalAmount: editSubtotal,
        discount: editDiscount,
        finalAmount: editFinalTotal,
        paymentMethod: editPaymentMethod,
        cashReceived: isCash ? editCashReceived : isCredit ? 0 : editFinalTotal,
        changeAmount: isCash ? Math.max(0, editCashReceived - editFinalTotal) : 0,
        paymentStatus: isCredit ? 'UNPAID' : 'PAID',
        dueDate: editingSale.dueDate,
        notes: editNotes.trim(),
        items: editItems,
      };

      await provider.updateSale(editingSale.invoiceNo, payload);
      await refreshData();
      await loadSales();
      setEditingSale(null);
      setFeedback({ type: 'success', text: `Transaksi ${editingSale.invoiceNo} berhasil diperbarui!` });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menyimpan perubahan transaksi.' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-600" />
            Laporan & Edit Transaksi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter riwayat penjualan per hari, per bulan, atau rentang tanggal tertentu, edit faktur, dan ekspor CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadSales}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportFilteredCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Ekspor Laporan (CSV)
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center gap-2.5 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            Periode:
          </span>
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: 'month', label: 'Per Bulan' },
              { id: 'range', label: 'Rentang Tanggal' },
              { id: 'all', label: 'Semua' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === m.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}

          {filterMode === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
            />
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
              />
              <span className="text-xs text-gray-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor faktur, nama pelanggan, atau nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 bg-white"
          >
            <option value="ALL">Semua Metode Pembayaran</option>
            <option value="CASH">Tunai (CASH)</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
            <option value="CREDIT">Tempo / Kredit</option>
          </select>
        </div>
      </div>

      {/* Ringkasan KPI Terfilter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Jumlah Transaksi</span>
            <ShoppingBag className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.count}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Total Omzet</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{formatRupiah(summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Total Diskon</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{formatRupiah(summary.totalDiscount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Estimasi Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{formatRupiah(summary.estimatedProfit)}</p>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">No. Faktur & Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Item Barang</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Total Akhir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Tidak ada transaksi yang sesuai filter periode ini.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.invoiceNo} className="hover:bg-gray-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{sale.invoiceNo}</div>
                      <div className="text-[11px] text-gray-500">{formatTanggal(sale.date)}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{sale.customerName || 'Pelanggan Umum'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">
                      {(sale.items || []).map((it) => `${it.productName} (${it.quantity}x)`).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentMethod === 'CREDIT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatRupiah(sale.finalAmount)}
                      {sale.discount > 0 && (
                        <div className="text-[10px] text-rose-500 font-normal">Disc: -{formatRupiah(sale.discount)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Transaksi */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Transaksi {editingSale.invoiceNo}</h2>
                <p className="text-xs text-gray-500">Perubahan akan otomatis menyesuaikan stok barang, piutang, & jurnal.</p>
              </div>
              <button onClick={() => setEditingSale(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Tambah Item ke Transaksi */}
              <div className="flex gap-2">
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs"
                >
                  <option value="">+ Tambah barang ke transaksi...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiah(p.sellingPrice)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProductToEdit}
                  className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              {/* Daftar Item */}
              <div className="border rounded-xl divide-y">
                {editItems.map((it, idx) => (
                  <div key={`${it.productId}-${idx}`} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{it.productName}</div>
                      <div className="text-gray-500">{formatRupiah(it.sellingPrice)} / pcs</div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value) || 1);
                        setEditItems((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: qty } : row)));
                      }}
                      className="w-16 px-2 py-1 border rounded-lg text-center font-bold"
                    />
                    <div className="w-24 text-right font-bold">{formatRupiah(it.sellingPrice * it.quantity)}</div>
                    <button
                      type="button"
                      onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pelanggan, Metode Bayar, Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pelanggan</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  >
                    <option value="">Pelanggan Umum (Cash)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => {
                      const m = e.target.value as PaymentMethod;
                      setEditPaymentMethod(m);
                      if (m === 'CASH' && editCashReceived < editFinalTotal) {
                        setEditCashReceived(editFinalTotal);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  >
                    <option value="CASH">Tunai (CASH)</option>
                    <option value="QRIS">QRIS</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CREDIT">Tempo / Kredit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Diskon (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatThousand(editDiscount)}
                    onChange={(e) => setEditDiscount(parseThousand(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
                {editPaymentMethod === 'CASH' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Uang Diterima (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousand(editCashReceived)}
                      onChange={(e) => setEditCashReceived(parseThousand(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  placeholder="Catatan transaksi..."
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Total Akhir Baru:</span>
                <span className="text-lg font-extrabold text-brand-700">{formatRupiah(editFinalTotal)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
