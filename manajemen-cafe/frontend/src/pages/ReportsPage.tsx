import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  Award,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import {
  db,
  type LocalOrder,
  type LocalExpense,
  type LocalIngredient,
  type LocalRecipe
} from '../db/cafeDb';
import { useApp } from '../context/AppContext';
import { formatCurrency, exportToCsv, printSummaryReportThermal } from '../utils/receiptFormatter';

type ReportTab = 'DASHBOARD' | 'SALES' | 'PROFIT_LOSS';

export const ReportsPage: React.FC = () => {
  const { cafeName, activeOutlet, printerConfig } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('DASHBOARD');

  // Data states
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const [recipes, setRecipes] = useState<LocalRecipe[]>([]);

  // Filter states
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const loadData = async () => {
    const allOrders = await db.orders.reverse().sortBy('createdAt');
    const allExpenses = await db.expenses.reverse().sortBy('expenseDate');
    const allIngredients = await db.ingredients.toArray();
    const allRecipes = await db.recipes.toArray();

    setOrders(allOrders);
    setExpenses(allExpenses);
    setIngredients(allIngredients);
    setRecipes(allRecipes);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered orders based on date range
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredOrders = orders.filter((o) => {
    const orderTime = new Date(o.createdAt).getTime();
    if (dateFilter === 'TODAY' && orderTime < startOfToday) return false;
    if (dateFilter === 'WEEK' && orderTime < startOfWeek) return false;
    if (dateFilter === 'MONTH' && orderTime < startOfMonth) return false;
    if (paymentFilter !== 'ALL' && o.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    const expTime = new Date(e.expenseDate).getTime();
    if (dateFilter === 'TODAY' && expTime < startOfToday) return false;
    if (dateFilter === 'WEEK' && expTime < startOfWeek) return false;
    if (dateFilter === 'MONTH' && expTime < startOfMonth) return false;
    return true;
  });

  // KPI Calculations
  const todayOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= startOfToday);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayExpense = expenses
    .filter((e) => new Date(e.expenseDate).getTime() >= startOfToday)
    .reduce((sum, e) => sum + e.amount, 0);
  const filterNetRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const filterAov = filteredOrders.length > 0 ? filterNetRevenue / filteredOrders.length : 0;

  // Breakdown payment methods
  const cashSales = filteredOrders.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalAmount, 0);
  const nonCashSales = filterNetRevenue - cashSales;

  // Top selling products ranking
  interface ProductSaleStat {
    name: string;
    qty: number;
    revenue: number;
  }
  const productSalesMap = new Map<string, ProductSaleStat>();
  filteredOrders.forEach((o) => {
    o.items.forEach((it) => {
      const existing = productSalesMap.get(it.productName) || { name: it.productName, qty: 0, revenue: 0 };
      existing.qty += it.quantity;
      existing.revenue += it.subtotal;
      productSalesMap.set(it.productName, existing);
    });
  });

  const topProducts: ProductSaleStat[] = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Critical stock ingredients
  const lowStockIngredients = ingredients.filter((i) => i.currentStock <= i.minimumStock);

  // Profit and Loss calculations
  // Estimate COGS from BOM recipe if exists, otherwise fallback to 35% standard cafe food/beverage cost
  let calculatedCogs = 0;
  filteredOrders.forEach((o) => {
    o.items.forEach((it) => {
      const recipe = recipes.find((r) => r.productId === it.productId);
      if (recipe && recipe.items.length > 0) {
        const costPerServing = recipe.items.reduce((cSum, rIt) => {
          const ing = ingredients.find((i) => i.id === rIt.ingredientId);
          return cSum + (ing ? ing.costPerUnit * rIt.quantity : 0);
        }, 0);
        calculatedCogs += costPerServing * it.quantity;
      } else {
        calculatedCogs += it.subtotal * 0.35;
      }
    });
  });

  const grossProfit = filterNetRevenue - calculatedCogs;
  const grossMarginPct = filterNetRevenue > 0 ? ((grossProfit / filterNetRevenue) * 100).toFixed(1) : '0';
  const filterTotalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - filterTotalExpense;
  const netMarginPct = filterNetRevenue > 0 ? ((netProfit / filterNetRevenue) * 100).toFixed(1) : '0';

  // ================= ACTION HANDLERS =================
  const handleExportSalesCsv = () => {
    const headers = ['No Order', 'Tanggal', 'Tipe', 'Meja', 'Metode Bayar', 'Subtotal', 'Diskon', 'Total'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.orderType,
      o.tableName || '-',
      o.paymentMethod,
      o.subtotal,
      o.discountAmount || 0,
      o.totalAmount
    ]);
    exportToCsv(`Laporan_Penjualan_${cafeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportPnlCsv = () => {
    const headers = ['Pos Laba Rugi', 'Nominal (Rp)', 'Persentase (%)'];
    const rows = [
      ['Pendapatan Omzet Penjualan (Net Sales)', filterNetRevenue, '100%'],
      ['Beban Pokok Penjualan (HPP / COGS)', -calculatedCogs, `${filterNetRevenue > 0 ? ((calculatedCogs / filterNetRevenue) * 100).toFixed(1) : 0}%`],
      ['LABA KOTOR (GROSS PROFIT)', grossProfit, `${grossMarginPct}%`],
      ['Total Beban Operasional', -filterTotalExpense, `${filterNetRevenue > 0 ? ((filterTotalExpense / filterNetRevenue) * 100).toFixed(1) : 0}%`],
      ['LABA BERSIH (NET PROFIT)', netProfit, `${netMarginPct}%`]
    ];
    exportToCsv(`Laporan_Laba_Rugi_${cafeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handlePrintDailyShift = async () => {
    await printSummaryReportThermal(
      printerConfig,
      cafeName,
      activeOutlet?.name || 'Cabang Utama',
      {
        date: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        totalRevenue: todayRevenue,
        totalOrders: todayOrders.length,
        cashSales: todayOrders.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalAmount, 0),
        nonCashSales: todayOrders.filter((o) => o.paymentMethod !== 'CASH').reduce((sum, o) => sum + o.totalAmount, 0),
        totalExpenses: todayExpense,
        netCashEstimate: todayRevenue - todayExpense
      }
    );
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Dashboard Analitik & Laporan Finansial</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Analisis omzet, laporan penjualan, performa menu terlaris, dan kalkulasi laba rugi (P&L).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'DASHBOARD'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('SALES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'SALES'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Penjualan</span>
          </button>
          <button
            onClick={() => setActiveTab('PROFIT_LOSS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'PROFIT_LOSS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Laba Rugi (P&L)</span>
          </button>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-stone-500 font-medium flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            Periode:
          </span>
          <div className="inline-flex bg-stone-100 p-0.5 rounded-xl border border-stone-200 shrink-0">
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'TODAY' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('WEEK')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'WEEK' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'MONTH' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'ALL' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'DASHBOARD' && (
            <button
              onClick={handlePrintDailyShift}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl font-medium flex items-center gap-1.5 transition shadow-sm ml-auto sm:ml-0"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Ringkasan Tutup Kasir</span>
            </button>
          )}

          {activeTab === 'SALES' && (
            <button
              onClick={handleExportSalesCsv}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium flex items-center gap-1.5 transition shadow-sm ml-auto sm:ml-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Data Penjualan (CSV)</span>
            </button>
          )}

          {activeTab === 'PROFIT_LOSS' && (
            <button
              onClick={handleExportPnlCsv}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium flex items-center gap-1.5 transition shadow-sm ml-auto sm:ml-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laba Rugi (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Omzet Terpilih</p>
                <h3 className="text-xl font-bold text-stone-900">{formatCurrency(filterNetRevenue)}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Total Transaksi</p>
                <h3 className="text-xl font-bold text-stone-900">{filteredOrders.length} Pesanan</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Beban Biaya Periode</p>
                <h3 className="text-xl font-bold text-red-600">{formatCurrency(filterTotalExpense)}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3.5">
              <div className={`p-3 rounded-xl ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Estimasi Laba Bersih</p>
                <h3 className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(netProfit)}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Selling Products */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Menu Paling Laris (Top 5 Best Sellers)</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">Berdasarkan Qty Terjual</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  Belum ada data penjualan pada periode ini.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topProducts.map((p, idx) => {
                    const maxQty = topProducts[0].qty || 1;
                    const pct = Math.round((p.qty / maxQty) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-800 flex items-center gap-2">
                            <span className="w-4.5 h-4.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>{p.name}</span>
                          </span>
                          <span className="font-mono text-stone-600">
                            <strong>{p.qty} cup/porsi</strong> ({formatCurrency(p.revenue)})
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Critical Stock & Cash Breakdown */}
            <div className="space-y-4">
              {/* Payment Split */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3 text-xs">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Komposisi Pembayaran</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Tunai (Cash):</span>
                    <span className="font-mono font-bold text-stone-900">{formatCurrency(cashSales)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Non-Tunai (QRIS/Trf):</span>
                    <span className="font-mono font-bold text-stone-900">{formatCurrency(nonCashSales)}</span>
                  </div>
                </div>
              </div>

              {/* Low stock alert */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Peringatan Bahan Menipis</span>
                  </h4>
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                    {lowStockIngredients.length} Bahan
                  </span>
                </div>

                {lowStockIngredients.length === 0 ? (
                  <p className="text-stone-400 italic">Semua stok bahan baku dalam batas aman.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {lowStockIngredients.map((ing) => (
                      <div key={ing.id} className="flex items-center justify-between py-1 border-b border-stone-100 last:border-none">
                        <span className="font-medium text-stone-800">{ing.name}</span>
                        <span className="font-mono text-red-600 font-bold">
                          {ing.currentStock} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED SALES REPORT */}
      {activeTab === 'SALES' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Log Transaksi Penjualan Kasir
              </h3>
              <p className="text-xs text-stone-500">
                Total {filteredOrders.length} transaksi senilai {formatCurrency(filterNetRevenue)} (Rata-rata keranjang: {formatCurrency(filterAov)})
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500">Metode Bayar:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Metode</option>
                <option value="CASH">Tunai (CASH)</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CARD">Kartu Debit/Kredit</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">No. Pesanan</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Meja / Pelanggan</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Diskon</th>
                  <th className="py-3 px-3 text-right">Total Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      Tidak ada transaksi penjualan pada kriteria ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                          {o.orderType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {o.tableName || o.customerName || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-medium text-stone-700">
                        {o.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                        {formatCurrency(o.subtotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-red-600">
                        {o.discountAmount ? `-${formatCurrency(o.discountAmount)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                        {formatCurrency(o.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROFIT AND LOSS (P&L) */}
      {activeTab === 'PROFIT_LOSS' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Laporan Laba Rugi Operasional Kafe</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Standar akuntansi: Omzet Penjualan dikurangi HPP Bahan Baku menghasilkan Laba Kotor, lalu dikurangi Beban Operasional untuk memperoleh Laba Bersih.
            </p>
          </div>

          {/* Detailed P&L Breakdown Table */}
          <div className="max-w-3xl mx-auto rounded-xl border border-stone-200 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Pos Akun Finansial</th>
                  <th className="py-3 px-4 text-right">Nilai Nominal</th>
                  <th className="py-3 px-4 text-right">% Terhadap Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {/* 1. REVENUE */}
                <tr className="bg-stone-50/50 font-bold">
                  <td className="py-2.5 px-4 text-stone-900">1. Pendapatan Penjualan Bersih (Net Revenue)</td>
                  <td className="py-2.5 px-4 text-right font-mono text-stone-900">{formatCurrency(filterNetRevenue)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">100.0%</td>
                </tr>

                {/* 2. COGS */}
                <tr>
                  <td className="py-2.5 px-4 pl-8 text-stone-600">
                    Beban Pokok Penjualan (HPP / Biaya Bahan Baku Terpakai)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-red-600">
                    -{formatCurrency(calculatedCogs)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-stone-500">
                    {filterNetRevenue > 0 ? ((calculatedCogs / filterNetRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* 3. GROSS PROFIT */}
                <tr className="bg-amber-50/60 font-bold border-t border-b border-amber-200">
                  <td className="py-3 px-4 text-amber-900">LABA KOTOR (GROSS PROFIT)</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-900">{formatCurrency(grossProfit)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-900">{grossMarginPct}%</td>
                </tr>

                {/* 4. EXPENSES */}
                <tr className="bg-stone-50/50 font-bold">
                  <td className="py-2.5 px-4 text-stone-900" colSpan={3}>
                    2. Beban Biaya Operasional
                  </td>
                </tr>
                {filteredExpenses.map((e, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-4 pl-8 text-stone-600">
                      [{e.category}] {e.description}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-stone-700">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-stone-400">
                      {filterNetRevenue > 0 ? ((e.amount / filterNetRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td className="py-2 px-4 pl-8 text-stone-400 italic" colSpan={3}>
                      Tidak ada catatan pengeluaran pada periode ini.
                    </td>
                  </tr>
                )}

                <tr className="border-t border-stone-200">
                  <td className="py-2.5 px-4 font-semibold text-stone-700">Total Beban Operasional</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-red-600">
                    -{formatCurrency(filterTotalExpense)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-stone-600">
                    {filterNetRevenue > 0 ? ((filterTotalExpense / filterNetRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* 5. NET PROFIT */}
                <tr className={`font-bold border-t-2 text-sm ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'}`}>
                  <td className="py-3.5 px-4">LABA BERSIH (NET PROFIT)</td>
                  <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(netProfit)}</td>
                  <td className="py-3.5 px-4 text-right font-mono">{netMarginPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
