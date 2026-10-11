import React, { useState } from 'react';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { Customer, Receivable } from '../types';

export const PiutangPage: React.FC = () => {
  const { 
    receivables, 
    customers, 
    provider, 
    refreshData 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'receivables' | 'customers'>('receivables');
  const [searchQuery, setSearchQuery] = useState('');
  const [agingFilter, setAgingFilter] = useState<'ALL' | 'CURRENT' | '1-30' | '31-60' | 'OVER-60' | 'PAID'>('ALL');

  // Modal State: Pay Receivable
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [payNotes, setPayNotes] = useState('');

  // Modal State: Customer CRUD
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<{
    name: string;
    phone: string;
    address: string;
    creditLimit: number;
  }>({
    name: '',
    phone: '',
    address: '',
    creditLimit: 5000000,
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper: Hitung keterlambatan (hari)
  const getDaysOverdue = (dueDateStr: string): number => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const today = new Date();
    // Reset jam agar perbandingan hari murni
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: Klasifikasi kategori umur piutang
  const getAgingCategory = (r: Receivable): 'CURRENT' | '1-30' | '31-60' | 'OVER-60' | 'PAID' => {
    if (r.status === 'PAID' || Number(r.remainingAmount) <= 0) return 'PAID';
    const days = getDaysOverdue(r.dueDate);
    if (days <= 0) return 'CURRENT';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    return 'OVER-60';
  };

  // Kalkulasi Aging Schedule Breakdown
  const agingStats = receivables.reduce(
    (acc, r) => {
      const remaining = Number(r.remainingAmount || 0);
      if (r.status === 'PAID' || remaining <= 0) {
        acc.paidCount += 1;
        return acc;
      }

      acc.totalOutstanding += remaining;
      acc.unpaidCount += 1;

      const cat = getAgingCategory(r);
      if (cat === 'CURRENT') {
        acc.currentAmount += remaining;
        acc.currentCount += 1;
      } else if (cat === '1-30') {
        acc.days1To30Amount += remaining;
        acc.days1To30Count += 1;
      } else if (cat === '31-60') {
        acc.days31To60Amount += remaining;
        acc.days31To60Count += 1;
      } else if (cat === 'OVER-60') {
        acc.daysOver60Amount += remaining;
        acc.daysOver60Count += 1;
      }
      return acc;
    },
    {
      totalOutstanding: 0,
      unpaidCount: 0,
      currentAmount: 0,
      currentCount: 0,
      days1To30Amount: 0,
      days1To30Count: 0,
      days31To60Amount: 0,
      days31To60Count: 0,
      daysOver60Amount: 0,
      daysOver60Count: 0,
      paidCount: 0,
    }
  );

  // Filter List Piutang
  const filteredReceivables = receivables.filter((r) => {
    const custName = (r.customerName || '').toLowerCase();
    const invoice = (r.invoiceNo || '').toLowerCase();
    const matchesSearch =
      custName.includes(searchQuery.toLowerCase()) ||
      invoice.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (agingFilter === 'ALL') return true;
    return getAgingCategory(r) === agingFilter;
  });

  // Filter List Pelanggan
  const filteredCustomers = customers.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery.toLowerCase());
  });

  // Modal Open Handlers
  const handleOpenPayModal = (rec: Receivable) => {
    setSelectedReceivable(rec);
    setPayAmount(Number(rec.remainingAmount));
    setPayMethod('CASH');
    setPayNotes('');
    setErrorMessage(null);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingAction) return; // Mencegah double submit / double click
    if (!selectedReceivable) return;

    if (payAmount <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih dari 0.');
      return;
    }

    if (payAmount > Number(selectedReceivable.remainingAmount)) {
      setErrorMessage(
        `Nominal bayar tidak boleh melebihi sisa piutang (${formatRupiah(selectedReceivable.remainingAmount)}).`
      );
      return;
    }

    setLoadingAction(true);
    setErrorMessage(null);

    try {
      await provider.payReceivable({
        receivableId: selectedReceivable.id,
        amount: payAmount,
        paymentMethod: payMethod,
        notes: payNotes || undefined,
      });

      await refreshData();
      setSelectedReceivable(null);
      setSuccessMessage('Pembayaran piutang berhasil dicatat dan saldo utang diperbarui!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran piutang.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
        creditLimit: customer.creditLimit || 5000000,
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({
        name: '',
        phone: '',
        address: '',
        creditLimit: 5000000,
      });
    }
    setErrorMessage(null);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }

    setLoadingAction(true);
    setErrorMessage(null);

    try {
      await provider.saveCustomer({
        id: editingCustomer ? editingCustomer.id : undefined,
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        creditLimit: Number(customerForm.creditLimit) || 0,
      });

      await refreshData();
      setIsCustomerModalOpen(false);
      setSuccessMessage('Data pelanggan berhasil disimpan!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data pelanggan.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 space-y-6">
      {/* Top Banner Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-600" />
            Piutang Pelanggan & Aging Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau nota penjualan bertempo, analisis umur piutang, pelunasan cicilan, dan limit kredit pelanggan.
          </p>
        </div>

        {/* Tab & Customer Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'receivables'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tagihan Piutang ({receivables.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Data Pelanggan ({customers.length})
            </button>
          </div>

          <button
            onClick={() => handleOpenCustomerModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            + Pelanggan
          </button>
        </div>
      </div>

      {/* AGING SCHEDULE BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Piutang</span>
            <span className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"><DollarSign className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-lg font-black text-gray-900 mt-2">
            {formatRupiah(agingStats.totalOutstanding)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{agingStats.unpaidCount} nota belum lunas</p>
        </div>

        {/* Lancar (Current) */}
        <div 
          onClick={() => setAgingFilter('CURRENT')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            agingFilter === 'CURRENT' ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Lancar (Current)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-lg font-black text-emerald-600 mt-2">
            {formatRupiah(agingStats.currentAmount)}
          </p>
          <p className="text-[11px] text-emerald-600/70 mt-0.5">{agingStats.currentCount} nota belum jatuh tempo</p>
        </div>

        {/* 1 - 30 Hari */}
        <div 
          onClick={() => setAgingFilter('1-30')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            agingFilter === '1-30' ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20' : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">1 - 30 Hari</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-lg font-black text-amber-600 mt-2">
            {formatRupiah(agingStats.days1To30Amount)}
          </p>
          <p className="text-[11px] text-amber-600/70 mt-0.5">{agingStats.days1To30Count} nota terlambat 1-30 hr</p>
        </div>

        {/* 31 - 60 Hari */}
        <div 
          onClick={() => setAgingFilter('31-60')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            agingFilter === '31-60' ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/20' : 'border-gray-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">31 - 60 Hari</span>
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-lg font-black text-orange-600 mt-2">
            {formatRupiah(agingStats.days31To60Amount)}
          </p>
          <p className="text-[11px] text-orange-600/70 mt-0.5">{agingStats.days31To60Count} nota terlambat 31-60 hr</p>
        </div>

        {/* > 60 Hari (Macet/Kritis) */}
        <div 
          onClick={() => setAgingFilter('OVER-60')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            agingFilter === 'OVER-60' ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/20' : 'border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">&gt; 60 Hari (Kritis)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><ShieldAlert className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-lg font-black text-rose-600 mt-2">
            {formatRupiah(agingStats.daysOver60Amount)}
          </p>
          <p className="text-[11px] text-rose-600/70 mt-0.5">{agingStats.daysOver60Count} nota risiko macet</p>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'receivables' ? 'Cari no faktur / nama pelanggan...' : 'Cari nama / nomor HP pelanggan...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {activeTab === 'receivables' && (
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Umur:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'CURRENT', label: 'Lancar' },
                { id: '1-30', label: '1-30 Hari' },
                { id: '31-60', label: '31-60 Hari' },
                { id: 'OVER-60', label: '>60 Hari' },
                { id: 'PAID', label: 'Lunas' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAgingFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    agingFilter === f.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: DAFTAR TAGIHAN PIUTANG */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Daftar Faktur Bertempo & Status Aging ({filteredReceivables.length})
            </h3>
            <span className="text-xs text-gray-500">
              Menampilkan {filteredReceivables.length} dari {receivables.length} data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Faktur</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4 text-right">Total Faktur</th>
                  <th className="py-3.5 px-4 text-right">Terbayar</th>
                  <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3.5 px-4 text-center">Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-center">Umur Piutang</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Tidak ada catatan piutang yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((r) => {
                    const daysOver = getDaysOverdue(r.dueDate);
                    const isPaid = r.status === 'PAID' || Number(r.remainingAmount) <= 0;
                    const cat = getAgingCategory(r);

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-xs">
                          {r.invoiceNo}
                          <div className="text-[10px] text-gray-400 font-normal">{formatTanggal(r.createdAt)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{r.customerName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-600 font-medium">
                          {formatRupiah(r.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                          {formatRupiah(r.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          {formatRupiah(r.remainingAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs">
                          <div className="font-medium text-gray-800">{r.dueDate || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Lunas
                            </span>
                          ) : cat === 'CURRENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3" /> Lancar ({Math.abs(daysOver)} hr lagi)
                            </span>
                          ) : cat === '1-30' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Lewat {daysOver} hari
                            </span>
                          ) : cat === '31-60' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <AlertTriangle className="w-3 h-3" /> Lewat {daysOver} hari
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" /> Kritis ({daysOver} hr)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => handleOpenPayModal(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                            >
                              Bayar / Cicil
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">Selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER DATA PELANGGAN & LIMIT KREDIT */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              Master Pelanggan & Pemantauan Limit Kredit ({filteredCustomers.length})
            </h3>
            <button
              onClick={() => handleOpenCustomerModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> + Tambah Pelanggan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Alamat</th>
                  <th className="py-3.5 px-4 text-right">Limit Kredit</th>
                  <th className="py-3.5 px-4 text-right">Utang Berjalan</th>
                  <th className="py-3.5 px-4 text-right">Sisa Plafon</th>
                  <th className="py-3.5 px-4 text-center">Penggunaan Limit</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Belum ada data pelanggan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const limit = Number(c.creditLimit || 0);
                    const debt = Number(c.currentDebt || 0);
                    const available = Math.max(0, limit - debt);
                    const usagePercent = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;
                    const isOverLimit = debt > limit;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {c.phone ? (
                            <span className="flex items-center gap-1 font-mono text-xs">
                              <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 text-xs max-w-xs truncate">
                          {c.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" /> {c.address}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                          {formatRupiah(limit)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          {formatRupiah(debt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {formatRupiah(available)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="w-32 mx-auto">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className={isOverLimit ? 'text-rose-600' : 'text-gray-600'}>
                                {usagePercent}%
                              </span>
                              {isOverLimit && <span className="text-rose-600">OVER LIMIT</span>}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isOverLimit
                                    ? 'bg-rose-600'
                                    : usagePercent > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenCustomerModal(c)}
                            className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded border border-brand-200 transition-colors"
                          >
                            Edit
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
      )}

      {/* MODAL: BAYAR / CICIL PIUTANG */}
      {selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pelunasan / Cicilan Piutang
                </h3>
                <p className="text-xs text-brand-100 font-mono mt-0.5">
                  Faktur: {selectedReceivable.invoiceNo}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceivable(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Rincian Piutang Header */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pelanggan:</span>
                  <span className="font-bold text-gray-900">{selectedReceivable.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Faktur:</span>
                  <span className="font-medium text-gray-900">{formatRupiah(selectedReceivable.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telah Dibayar:</span>
                  <span className="font-medium text-emerald-600">{formatRupiah(selectedReceivable.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black">
                  <span className="text-gray-900">Sisa Piutang Wajib Dibayar:</span>
                  <span className="text-rose-600">{formatRupiah(selectedReceivable.remainingAmount)}</span>
                </div>
              </div>

              {/* Input Nominal Pembayaran */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Nominal Pembayaran (Rp) *</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.round(Number(selectedReceivable.remainingAmount) / 2))}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      50% (Cicil)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(Number(selectedReceivable.remainingAmount))}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 hover:bg-brand-100 text-brand-700"
                    >
                      100% (Lunas)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedReceivable.remainingAmount)}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-base font-bold text-brand-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Sisa setelah bayar: <span className="font-bold text-gray-800">{formatRupiah(Math.max(0, Number(selectedReceivable.remainingAmount) - payAmount))}</span>
                </p>
              </div>

              {/* Pilihan Metode Bayar */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Metode Pembayaran *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Tunai (Kas)' },
                    { id: 'TRANSFER', label: 'Transfer Bank' },
                    { id: 'QRIS', label: 'QRIS' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPayMethod(m.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        payMethod === m.id
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Titipan cicilan minggu pertama..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedReceivable(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {loadingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction ? 'Memproses...' : 'Konfirmasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PELANGGAN */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-brand-400" />
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bpk. Ahmad / Toko Sinar..."
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alamat Pelanggan
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap..."
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Batas Limit Kredit (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={customerForm.creditLimit}
                  onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Batas maksimal utang yang diizinkan saat belanja tempo di kasir POS.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {loadingAction ? 'Menyimpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
