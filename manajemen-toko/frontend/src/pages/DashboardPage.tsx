import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  CreditCard, 
  ArrowRight, 
  TrendingUp, 
  Download, 
  DollarSign, 
  Clock, 
  Eye, 
  Printer, 
  RefreshCw,
  FileSpreadsheet,
  Award,
  Layers,
  Truck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { Sale } from '../types';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { 
    settings, 
    products, 
    receivables, 
    provider
  } = useStore();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoadingSales(true);
    try {
      const history = await provider.getSalesHistory();
      setSales(history || []);
    } catch (err) {
      console.error('Gagal memuat riwayat penjualan:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  // 1. Perhitungan Tanggal
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  // 2. Metrik Penjualan
  const todaySales = sales.filter((s) => s.date && s.date.slice(0, 10) === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.finalAmount || 0), 0);

  const monthSales = sales.filter((s) => s.date && s.date.slice(0, 7) === currentMonthStr);
  const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.finalAmount || 0), 0);

  // Estimasi Laba Kotor dari Seluruh Penjualan
  let totalGrossProfit = 0;
  sales.forEach((s) => {
    if (s.items) {
      s.items.forEach((item) => {
        const profitPerItem = (Number(item.sellingPrice) - Number(item.costPrice)) * Number(item.quantity);
        totalGrossProfit += profitPerItem;
      });
    }
  });

  // 3. Valuasi Nilai Persediaan Stok Toko
  const totalInventoryValuation = products.reduce((sum, p) => {
    return sum + (Number(p.costPrice || 0) * Number(p.stock || 0));
  }, 0);

  // 4. Piutang Aktif & Kritis
  const unpaidReceivables = receivables.filter((r) => r.status !== 'PAID' && Number(r.remainingAmount) > 0);
  const totalOutstandingReceivables = unpaidReceivables.reduce(
    (sum, r) => sum + Number(r.remainingAmount || 0),
    0
  );

  const overdueReceivables = unpaidReceivables.filter((r) => {
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > due;
  });

  // 5. Stok Kritis
  const lowStockProducts = products.filter((p) => Number(p.stock) <= Number(p.minStock));

  // 6. Analisis Produk Terlaris (Top 5 Best-Selling)
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  sales.forEach((s) => {
    if (s.items) {
      s.items.forEach((it) => {
        const cur = productSalesMap.get(it.productId) || { name: it.productName, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity || 0);
        cur.revenue += Number(it.subtotal || 0);
        productSalesMap.set(it.productId, cur);
      });
    }
  });

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxTopQty = topSellingProducts.length > 0 ? topSellingProducts[0].qty : 1;

  // 7. Ekspor Penjualan ke CSV
  const handleExportSalesCSV = () => {
    if (sales.length === 0) {
      alert('Belum ada data transaksi penjualan untuk diekspor.');
      return;
    }

    const headers = ['No Faktur', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Status Bayar', 'Total Tagihan', 'Diskon', 'Total Akhir', 'Catatan'];
    const rows = sales.map((s) => [
      `"${s.invoiceNo}"`,
      `"${s.date}"`,
      `"${s.customerName || 'Pelanggan Umum'}"`,
      `"${s.paymentMethod}"`,
      `"${s.paymentStatus}"`,
      s.totalAmount,
      s.discount,
      s.finalAmount,
      `"${s.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 8. Ekspor Jurnal Akuntansi ke CSV
  const handleExportAccountingCSV = async () => {
    try {
      const rep = await provider.getAccountingReport();
      const journals = rep.journal || [];
      if (journals.length === 0) {
        alert('Belum ada data jurnal akuntansi untuk diekspor.');
        return;
      }

      const headers = ['No Jurnal', 'Tanggal', 'Tipe Ref', 'No Ref', 'Kode Akun', 'Nama Akun', 'Debet', 'Kredit', 'Keterangan'];
      const rows = journals.map((j) => [
        `"${j.entryNo}"`,
        `"${j.date}"`,
        `"${j.refType}"`,
        `"${j.refNo}"`,
        `"${j.accountCode}"`,
        `"${j.accountName}"`,
        j.debit,
        j.credit,
        `"${j.notes || ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Jurnal_Akuntansi_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Gagal mengekspor jurnal: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 space-y-8">
      {/* Welcome Banner & Quick Shortcuts */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            {settings.storeName || 'Toko UMKM Indonesia'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Dashboard Analitik Operasional & Keuangan Toko
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm leading-relaxed mb-6">
            Pantau ringkasan omzet harian, sisa aset persediaan, piutang tertagih, dan produk terlaris secara langsung.
          </p>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('kasir')}
              className="inline-flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              Buka Kasir POS
            </button>

            <button
              onClick={() => setActiveTab('pembelian')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" />
              + Pengadaan Stok (PO)
            </button>

            <button
              onClick={() => setActiveTab('piutang')}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              Tagih Piutang
            </button>

            <button
              onClick={() => setActiveTab('akuntansi')}
              className="inline-flex items-center gap-2 bg-brand-800/70 hover:bg-brand-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs border border-white/20 backdrop-blur-md transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Laporan Laba Rugi
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Layers className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* KPI 5 CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Penjualan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Omzet Hari Ini</span>
              <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><ShoppingCart className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-xl font-black text-brand-700 mt-2">{formatRupiah(todayRevenue)}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{todaySales.length} transaksi kasir hari ini</p>
        </div>

        {/* Card 2: Penjualan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Omzet Bulan Ini</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-xl font-black text-gray-900 mt-2">{formatRupiah(monthRevenue)}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{monthSales.length} transaksi bulan berjalan</p>
        </div>

        {/* Card 3: Estimasi Laba Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Est. Laba Kotor</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-xl font-black text-emerald-600 mt-2">{formatRupiah(totalGrossProfit)}</p>
          </div>
          <p className="text-[11px] text-emerald-600/70 mt-2">Penjualan dikurangi modal HPP</p>
        </div>

        {/* Card 4: Valuasi Stok Fisik */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aset Stok Barang</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Package className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-xl font-black text-purple-700 mt-2">{formatRupiah(totalInventoryValuation)}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{products.length} macam barang fisik</p>
        </div>

        {/* Card 5: Piutang Usaha */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Piutang Tertagih</span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><CreditCard className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-xl font-black text-rose-600 mt-2">{formatRupiah(totalOutstandingReceivables)}</p>
          </div>
          <p className="text-[11px] text-rose-600/70 mt-2">{unpaidReceivables.length} nota piutang aktif</p>
        </div>
      </div>

      {/* OPERATIONAL ALERTS: CRITICAL STOCK & OVERDUE RECEIVABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Kiri: Peringatan Stok Kritis */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan Stok Kritis / Minimum ({lowStockProducts.length})
            </h3>
            <button
              onClick={() => setActiveTab('produk')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Kelola stok <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                Semua stok barang aman di atas batas minimum.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{p.name}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">Min Stok: {p.minStock} {p.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-rose-100 text-rose-800">
                      Sisa: {p.stock} {p.unit}
                    </span>
                    <button
                      onClick={() => setActiveTab('pembelian')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                    >
                      Beli PO
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box Kanan: Piutang Jatuh Tempo / Overdue */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              Piutang Lewat Jatuh Tempo / Kritis ({overdueReceivables.length})
            </h3>
            <button
              onClick={() => setActiveTab('piutang')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Lihat aging <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {overdueReceivables.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                Tidak ada piutang yang menunggak atau lewat jatuh tempo.
              </div>
            ) : (
              overdueReceivables.map((r) => (
                <div
                  key={r.id}
                  className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{r.customerName}</h4>
                    <span className="text-[10px] text-rose-700 font-mono">Faktur: {r.invoiceNo} | Tempo: {r.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-rose-600">
                      {formatRupiah(r.remainingAmount)}
                    </span>
                    <button
                      onClick={() => setActiveTab('piutang')}
                      className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS & DATA EXPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1-2: Produk Terlaris (Top Selling) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              5 Produk Paling Laris Terjual (Best Sellers)
            </h3>
            <span className="text-xs text-gray-400">Berdasarkan volume transaksi kasir</span>
          </div>

          <div className="space-y-3">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Belum ada transaksi penjualan yang tercatat.
              </div>
            ) : (
              topSellingProducts.map((item, idx) => {
                const percent = Math.round((item.qty / maxTopQty) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-bold text-gray-900">
                        {item.qty} Terjual ({formatRupiah(item.revenue)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom 3: Ekspor Laporan & Status Database */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor Data & Laporan Spreadsheet
            </h3>
            <p className="text-xs text-gray-500 mt-2 mb-4 leading-relaxed">
              Unduh rekap operasional toko ke berkas format CSV yang kompatibel dengan Microsoft Excel dan Google Sheets.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExportSalesCSV}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Ekspor Laporan Penjualan (CSV)
              </button>

              <button
                onClick={handleExportAccountingCSV}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Ekspor Jurnal Akuntansi (CSV)
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
            Penyimpanan Aktif: <span className="font-bold text-gray-700">{settings.dataSourceMode.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* RIWAYAT PENJUALAN KASIR TERKINI */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              Riwayat Transaksi Penjualan Kasir ({sales.length})
            </h3>
            <p className="text-[11px] text-gray-500">Daftar transaksi kasir terurut dari yang terbaru</p>
          </div>
          <button
            onClick={loadSalesData}
            disabled={loadingSales}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSales ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Faktur</th>
                <th className="py-3.5 px-4">Waktu Transaksi</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Belum ada transaksi kasir yang tercatat. Buka menu Kasir POS untuk mulai bertransaksi.
                  </td>
                </tr>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <tr key={sale.invoiceNo} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-900">
                      {sale.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {formatTanggal(sale.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {sale.customerName || 'Pelanggan Umum'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-gray-900">
                      {formatRupiah(sale.finalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {sale.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSaleDetail(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded border border-brand-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DETAIL STRUK PENJUALAN */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Rincian Faktur: {selectedSaleDetail.invoiceNo}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatTanggal(selectedSaleDetail.date)}</p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Pelanggan:</span>
                  <span className="font-bold text-gray-900">{selectedSaleDetail.customerName || 'Pelanggan Umum'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Metode Pembayaran:</span>
                  <span className="font-bold text-gray-900">{selectedSaleDetail.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedSaleDetail.paymentStatus}</span>
                </div>
                {selectedSaleDetail.dueDate && (
                  <div>
                    <span className="text-gray-500 block">Jatuh Tempo:</span>
                    <span className="font-bold text-amber-600">{selectedSaleDetail.dueDate}</span>
                  </div>
                )}
              </div>

              {/* Tabel Barang Belanjaan */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                    <tr>
                      <th className="py-2 px-3">Item Barang</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSaleDetail.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatRupiah(item.sellingPrice)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-xs">
                    {selectedSaleDetail.discount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-1.5 px-3 text-right text-gray-500">Diskon:</td>
                        <td className="py-1.5 px-3 text-right text-rose-600">-{formatRupiah(selectedSaleDetail.discount)}</td>
                      </tr>
                    )}
                    <tr className="text-sm">
                      <td colSpan={3} className="py-2 px-3 text-right text-gray-900">Total Akhir:</td>
                      <td className="py-2 px-3 text-right text-brand-700 font-black">
                        {formatRupiah(selectedSaleDetail.finalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" /> Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaleDetail(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold"
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
