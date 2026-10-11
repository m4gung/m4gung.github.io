import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import { AuditAndSecurityService } from '../services/auditService';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Download,
  Receipt,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import type { Transaction, Expense, StaffAllowance } from '../types';

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();

  // Active Sub-Tab: 'DASHBOARD' vs 'TRANSACTIONS_LOG'
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS_LOG'>('DASHBOARD');

  // Master Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allowances, setAllowances] = useState<StaffAllowance[]>([]);

  // Filter Date Range (Default: Bulan Ini)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  // Modal Detail Transaksi
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadData = async () => {
    try {
      const tList = await db.transactions.toArray();
      const eList = await db.expenses.toArray();
      const aList = await db.staffAllowances.toArray();

      setTransactions(tList);
      setExpenses(eList);
      setAllowances(aList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Data berdasarkan Range Tanggal
  const filteredTxs = transactions.filter(t => {
    const d = t.createdAt.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const completedTxs = filteredTxs.filter(t => t.status === 'COMPLETED');

  const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
  const filteredAllowances = allowances.filter(a => a.date >= startDate && a.date <= endDate);

  // KALKULASI KEUANGAN PRESISI (Sesuai Aturan PROJECT_CONTEXT.md)
  let serviceRevenue = 0;
  let productRevenue = 0;
  let productCostTotal = 0; // HPP Produk
  let barberCommissionTotal = 0; // Komisi Cukur

  completedTxs.forEach(tx => {
    tx.items.forEach(it => {
      if (it.type === 'SERVICE') {
        serviceRevenue += it.subtotal;
        barberCommissionTotal += it.calculatedCommission || 0;
      } else if (it.type === 'PRODUCT') {
        productRevenue += it.subtotal;
        productCostTotal += (it.costPrice || 0) * (it.quantity || 1);
      }
    });
  });

  // Omzet Bersih Transaksi (Setelah Diskon)
  const totalDiscount = completedTxs.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
  const netRevenue = Math.max(0, serviceRevenue + productRevenue - totalDiscount);

  // Laba Kotor Produk = Omzet Produk - HPP Produk
  const grossProductProfit = Math.max(0, productRevenue - productCostTotal);

  // Laba Kotor Jasa = Omzet Jasa - Komisi Barber
  const grossServiceProfit = Math.max(0, serviceRevenue - barberCommissionTotal);

  // Biaya Staf (Uang Makan & Bonus Karyawan dari Absensi & Allowance)
  const totalStaffCost = filteredAllowances.reduce((sum, a) => {
    return a.type === 'KASBON' ? sum - a.amount : sum + a.amount;
  }, 0);

  // Biaya Operasional Toko (Listrik, sewa, perlengkapan)
  const totalOperatingExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Total Beban Toko = Biaya Operasional + Biaya Staf
  const totalShopExpenses = totalOperatingExpense + totalStaffCost;

  // Laba Operasional Bersih Toko
  const netOperatingProfit = (grossServiceProfit + grossProductProfit) - totalShopExpenses;

  // Ekspor Transaksi ke File CSV
  const handleExportCSV = () => {
    if (completedTxs.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor', 'error');
      return;
    }

    const headers = ['No Faktur', 'Tanggal', 'Pelanggan', 'No WA', 'Metode', 'Item Rincian', 'Subtotal', 'Diskon', 'Total'];
    const rows = completedTxs.map(t => {
      const itemsSummary = t.items.map(it => `${it.quantity}x ${it.name}`).join('; ');
      return [
        t.invoiceNumber,
        new Date(t.createdAt).toLocaleString('id-ID'),
        `"${t.customerName}"`,
        t.customerPhone || '-',
        t.paymentMethod,
        `"${itemsSummary}"`,
        t.subtotal,
        t.discountAmount,
        t.totalAmount
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Transaksi_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('File CSV berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Dashboard Keuangan & Laba Bersih Operasional
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Analisis omzet jasa vs produk, margin HPP, komisi barber, pengeluaran toko, dan laba bersih.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Ringkasan Keuangan
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS_LOG')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'TRANSACTIONS_LOG'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Riwayat Transaksi ({filteredTxs.length})
          </button>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-neutral-300">Filter Periode:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-100 focus:border-amber-500 focus:outline-none"
          />
          <span className="text-neutral-500">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-100 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 mr-1 text-amber-400" />
          Ekspor CSV / Excel
        </Button>
      </div>

      {/* TAB 1: DASHBOARD FINANCIAL SUMMARY */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Omzet Bersih */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-neutral-400 font-medium flex items-center justify-between">
                Omzet Bersih
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </span>
              <h3 className="text-2xl font-black text-amber-400">{formatRupiah(netRevenue)}</h3>
              <p className="text-[11px] text-neutral-500">
                {completedTxs.length} transaksi selesai
              </p>
            </div>

            {/* Laba Kotor Produk */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-neutral-400 font-medium flex items-center justify-between">
                Laba Produk Retail
                <Package className="w-4 h-4 text-emerald-400" />
              </span>
              <h3 className="text-2xl font-black text-emerald-400">{formatRupiah(grossProductProfit)}</h3>
              <p className="text-[11px] text-neutral-500">
                Penjualan: {formatRupiah(productRevenue)} | HPP: {formatRupiah(productCostTotal)}
              </p>
            </div>

            {/* Total Beban Operasional */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-neutral-400 font-medium flex items-center justify-between">
                Beban Toko & Staf
                <Receipt className="w-4 h-4 text-rose-400" />
              </span>
              <h3 className="text-2xl font-black text-rose-400">{formatRupiah(totalShopExpenses)}</h3>
              <p className="text-[11px] text-neutral-500">
                Toko: {formatRupiah(totalOperatingExpense)} | Staf: {formatRupiah(totalStaffCost)}
              </p>
            </div>

            {/* LABA BERSIH OPERASIONAL */}
            <div className={`border rounded-2xl p-5 space-y-2 ${
              netOperatingProfit >= 0
                ? 'bg-emerald-950/20 border-emerald-800/40'
                : 'bg-rose-950/20 border-rose-800/40'
            }`}>
              <span className="text-xs text-neutral-300 font-bold flex items-center justify-between">
                Laba Bersih Toko
                <DollarSign className={`w-4 h-4 ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              </span>
              <h3 className={`text-2xl font-black ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatRupiah(netOperatingProfit)}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Setelah komisi, HPP & seluruh beban
              </p>
            </div>
          </div>

          {/* Rincian Komposisi Keuangan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Breakdown Pendapatan */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                Rincian Arus Pendapatan (Revenue)
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Pendapatan Jasa Cukur:</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(serviceRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Pendapatan Produk Retail (Pomade/Tonic):</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(productRevenue)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-rose-400">
                    <span>Total Diskon Pelanggan:</span>
                    <span className="font-bold">-{formatRupiah(totalDiscount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-sm font-extrabold text-amber-400">
                  <span>Total Omzet Bersih:</span>
                  <span>{formatRupiah(netRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Biaya & Komisi */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                Rincian Biaya & Pengeluaran
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Komisi Barber (Bagi Hasil Layanan):</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(barberCommissionTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>HPP Modal Produk Terjual:</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(productCostTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Uang Makan & Bonus Staf:</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(totalStaffCost)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Biaya Operasional Toko (Sewa/Listrik/Alat):</span>
                  <span className="font-bold text-neutral-100">{formatRupiah(totalOperatingExpense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSAKSI LENGKAP */}
      {activeTab === 'TRANSACTIONS_LOG' && (
        <div className="space-y-4">
          {filteredTxs.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
              <Receipt className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Belum ada transaksi pada rentang tanggal ini.</p>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
              {filteredTxs.map(t => {
                const isCancelled = t.status === 'CANCELLED';
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTx(t)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-400">
                          {t.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {new Date(t.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300">
                        Pelanggan: <strong className="text-neutral-100">{t.customerName}</strong>{' '}
                        {t.customerPhone && `(${t.customerPhone})`}
                      </p>

                      <p className="text-[11px] text-neutral-400 line-clamp-1">
                        {t.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right self-end sm:self-auto">
                      <span className="text-sm font-black text-neutral-100 block">
                        {formatRupiah(t.totalAmount)}
                      </span>
                      <span className="text-[11px] text-neutral-400 uppercase font-medium">
                        {t.paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL TRANSAKSI MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-100">Detail Transaksi</h3>
                <span className="font-mono text-xs text-amber-400">{selectedTx.invoiceNumber}</span>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-neutral-400 hover:text-neutral-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <p className="text-neutral-400">Waktu: <strong className="text-neutral-200">{new Date(selectedTx.createdAt).toLocaleString('id-ID')}</strong></p>
                <p className="text-neutral-400">Pelanggan: <strong className="text-neutral-200">{selectedTx.customerName} ({selectedTx.customerPhone || '-'})</strong></p>
                <p className="text-neutral-400">Kasir: <strong className="text-neutral-200">{selectedTx.cashierName}</strong></p>
                <p className="text-neutral-400">Metode Bayar: <strong className="text-neutral-200">{selectedTx.paymentMethod}</strong></p>
              </div>

              {/* Items */}
              <div className="space-y-2 divide-y divide-neutral-800/80">
                {selectedTx.items.map((it, idx) => (
                  <div key={idx} className="pt-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-100">{it.quantity}x {it.name}</p>
                      {it.barberName && (
                        <p className="text-[10px] text-amber-400">Barber: {it.barberName} (Komisi: {formatRupiah(it.calculatedCommission || 0)})</p>
                      )}
                    </div>
                    <span className="font-bold text-neutral-200">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-800 space-y-1 font-semibold text-neutral-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedTx.subtotal)}</span>
                </div>
                {selectedTx.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedTx.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-amber-400 pt-1">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(selectedTx.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedTx.status === 'COMPLETED' && (
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    const reason = prompt('Masukkan alasan pembatalan transaksi:');
                    if (reason && reason.trim()) {
                      const res = await AuditAndSecurityService.voidTransaction(selectedTx.id, reason);
                      if (res.success) {
                        showToast(res.message, 'success');
                        setSelectedTx(null);
                        await loadData();
                      } else {
                        showToast(res.message, 'error');
                      }
                    }
                  }}
                >
                  Batalkan Transaksi (Void)
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)} className="flex-1">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
