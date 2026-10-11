import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Scale, 
  TrendingUp, 
  ListTree, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  Wallet,
  Building
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatTanggal } from '../utils/format';
import type { JournalLine, ChartOfAccount } from '../types';

export const AkuntansiPage: React.FC = () => {
  const { coa, provider } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'income' | 'balance' | 'journal' | 'ledger' | 'coa'>('income');
  const [journals, setJournals] = useState<JournalLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [journalFilter, setJournalFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // General Ledger Selected Account
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1101');

  // Modal Jurnal Manual State
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualLines, setManualLines] = useState<
    Array<{ accountCode: string; debit: number; credit: number; notes: string }>
  >([
    { accountCode: '6101', debit: 0, credit: 0, notes: '' },
    { accountCode: '1101', debit: 0, credit: 0, notes: '' },
  ]);

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const rep = await provider.getAccountingReport();
      setJournals(rep.journal || []);
    } catch (err) {
      console.error('Gagal memuat data jurnal akuntansi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper Peta Nama COA
  const coaMap = new Map<string, ChartOfAccount>();
  coa.forEach((c) => coaMap.set(c.code, c));

  // Hitung Saldo Akhir Semua Akun Berdasarkan Seluruh Jurnal
  const accountBalances = new Map<string, number>();
  coa.forEach((c) => accountBalances.set(c.code, 0));

  journals.forEach((j) => {
    const acc = coaMap.get(j.accountCode);
    const cur = accountBalances.get(j.accountCode) || 0;
    const debit = Number(j.debit || 0);
    const credit = Number(j.credit || 0);

    if (acc) {
      if (acc.normalBalance === 'DEBIT') {
        accountBalances.set(j.accountCode, cur + (debit - credit));
      } else {
        accountBalances.set(j.accountCode, cur + (credit - debit));
      }
    } else {
      accountBalances.set(j.accountCode, cur + (debit - credit));
    }
  });

  // Metrik Laba Rugi
  const revenue = accountBalances.get('4101') || 0;
  const cogs = accountBalances.get('5101') || 0;
  const grossProfit = revenue - cogs;
  const opex = accountBalances.get('6101') || 0;
  const netProfit = grossProfit - opex;

  // Metrik Neraca (Balance Sheet)
  const kas = accountBalances.get('1101') || 0;
  const bank = accountBalances.get('1102') || 0;
  const piutang = accountBalances.get('1103') || 0;
  const persediaan = accountBalances.get('1201') || 0;
  const totalAssets = kas + bank + piutang + persediaan;

  const utang = accountBalances.get('2101') || 0;
  const modal = accountBalances.get('3101') || 0;
  const labaDitahan = accountBalances.get('3201') || 0;
  const totalEquity = modal + labaDitahan + netProfit;
  const totalLiabilitiesAndEquity = utang + totalEquity;
  const isBalanceSheetBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  // Filter Jurnal
  const filteredJournals = journals.filter((j) => {
    const matchesRef = journalFilter === 'ALL' || j.refType === journalFilter;
    const matchesSearch =
      (j.entryNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.accountName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.refNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRef && matchesSearch;
  });

  // Buku Besar untuk Akun Terpilih
  const currentLedgerCoa = coaMap.get(selectedLedgerAccount);
  const ledgerLines = journals
    .filter((j) => j.accountCode === selectedLedgerAccount)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let ledgerRunningBalance = 0;
  const computedLedgerLines = ledgerLines.map((line) => {
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (currentLedgerCoa?.normalBalance === 'DEBIT') {
      ledgerRunningBalance += debit - credit;
    } else {
      ledgerRunningBalance += credit - debit;
    }
    return {
      ...line,
      runningBalance: ledgerRunningBalance,
    };
  });

  // Modal Jurnal Manual Handlers
  const handleOpenJournalModal = () => {
    setManualDescription('');
    setManualLines([
      { accountCode: '6101', debit: 0, credit: 0, notes: 'Beban Operasional' },
      { accountCode: '1101', debit: 0, credit: 0, notes: 'Kas Toko' },
    ]);
    setErrorMessage(null);
    setIsJournalModalOpen(true);
  };

  const handleAddManualLine = () => {
    setManualLines([
      ...manualLines,
      { accountCode: '1101', debit: 0, credit: 0, notes: '' },
    ]);
  };

  const handleRemoveManualLine = (idx: number) => {
    if (manualLines.length <= 2) return;
    setManualLines(manualLines.filter((_, i) => i !== idx));
  };

  const handleManualLineChange = (
    index: number,
    field: 'accountCode' | 'debit' | 'credit' | 'notes',
    value: any
  ) => {
    const updated = [...manualLines];
    updated[index] = { ...updated[index], [field]: value };
    setManualLines(updated);
  };

  const totalManualDebit = manualLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalManualCredit = manualLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isManualBalanced =
    totalManualDebit > 0 && Math.abs(totalManualDebit - totalManualCredit) < 0.01;

  const handleSaveManualJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingAction) return; // Mencegah double submit / double click
    if (!manualDescription.trim()) {
      setErrorMessage('Keterangan transaksi jurnal wajib diisi.');
      return;
    }

    if (!isManualBalanced) {
      setErrorMessage(
        `Jurnal tidak seimbang! Total Debet (${formatRupiah(totalManualDebit)}) harus persis sama dengan Total Kredit (${formatRupiah(totalManualCredit)}).`
      );
      return;
    }

    setLoadingAction(true);
    setErrorMessage(null);

    try {
      await provider.createManualJournal({
        description: manualDescription.trim(),
        referenceType: 'MANUAL',
        lines: manualLines.map((l) => ({
          accountCode: l.accountCode,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          notes: l.notes.trim() || manualDescription.trim(),
        })),
      });

      await loadAccountingData();
      setIsJournalModalOpen(false);
      setSuccessMessage('Jurnal umum manual berhasil dicatat!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan jurnal manual.');
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-600" />
            Sistem Akuntansi SAK EMKM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Penjurnalan otomatis *double-entry*, buku besar, laporan laba rugi, dan neraca keuangan seimbang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAccountingData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenJournalModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            + Buat Jurnal Manual
          </button>
        </div>
      </div>

      {/* 5 SUB-TABS NAVIGATION */}
      <div className="bg-gray-100 p-1.5 rounded-2xl flex flex-wrap gap-1">
        {[
          { id: 'income', label: 'Laba Rugi', icon: TrendingUp },
          { id: 'balance', label: 'Neraca (Posisi Keuangan)', icon: Scale },
          { id: 'journal', label: `Jurnal Umum (${journals.length})`, icon: FileText },
          { id: 'ledger', label: 'Buku Besar (Ledger)', icon: ListTree },
          { id: 'coa', label: `Bagan Akun / COA (${coa.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-brand-700 shadow-sm border border-brand-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LAPORAN LABA RUGI */}
      {activeSubTab === 'income' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Pendapatan Penjualan
              </span>
              <p className="text-2xl font-black text-gray-900 mt-2">{formatRupiah(revenue)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Akun 4101 (Kredit)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Beban Pokok Penjualan (HPP)
              </span>
              <p className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(cogs)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Akun 5101 (Debet)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Laba Kotor (Gross Profit)
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(grossProfit)}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Margin:{' '}
                {revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Laba Bersih (Net Profit)
              </span>
              <p className={`text-2xl font-black mt-2 ${netProfit >= 0 ? 'text-brand-700' : 'text-rose-600'}`}>
                {formatRupiah(netProfit)}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Setelah Beban Operasional</p>
            </div>
          </div>

          {/* Tabel Rincian Laba Rugi */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Laporan Laba Rugi Komprehensif (Income Statement)
              </h3>
              <p className="text-xs text-gray-500">
                Format standar SAK EMKM untuk mengukur kinerja profitabilitas operasional toko.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              {/* Pendapatan */}
              <div>
                <div className="flex justify-between py-2 font-bold text-sm text-gray-800 border-b border-gray-100">
                  <span>1. PENDAPATAN OPERASIONAL</span>
                  <span>{formatRupiah(revenue)}</span>
                </div>
                <div className="flex justify-between py-2 text-xs text-gray-600 pl-4">
                  <span>Pendapatan Penjualan Toko (4101)</span>
                  <span>{formatRupiah(revenue)}</span>
                </div>
              </div>

              {/* HPP */}
              <div>
                <div className="flex justify-between py-2 font-bold text-sm text-rose-800 border-b border-gray-100">
                  <span>2. BEBAN POKOK PENJUALAN (HPP)</span>
                  <span>({formatRupiah(cogs)})</span>
                </div>
                <div className="flex justify-between py-2 text-xs text-gray-600 pl-4">
                  <span>Beban Pokok Penjualan Barang Dagang (5101)</span>
                  <span>({formatRupiah(cogs)})</span>
                </div>
              </div>

              {/* Laba Kotor */}
              <div className="flex justify-between py-3 px-4 bg-emerald-50 rounded-xl font-black text-sm text-emerald-900 border border-emerald-200">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span>{formatRupiah(grossProfit)}</span>
              </div>

              {/* Beban Operasional */}
              <div>
                <div className="flex justify-between py-2 font-bold text-sm text-rose-800 border-b border-gray-100">
                  <span>3. BEBAN OPERASIONAL TOKO</span>
                  <span>({formatRupiah(opex)})</span>
                </div>
                <div className="flex justify-between py-2 text-xs text-gray-600 pl-4">
                  <span>Beban Operasional (Listrik, Sewa, Gaji, dll) (6101)</span>
                  <span>({formatRupiah(opex)})</span>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="flex justify-between py-3.5 px-4 bg-brand-50 rounded-xl font-black text-base text-brand-900 border border-brand-200">
                <span>LABA BERSIH TAHUN BERJALAN (NET PROFIT)</span>
                <span className={netProfit >= 0 ? 'text-brand-700' : 'text-rose-600'}>
                  {formatRupiah(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN NERACA (POSISI KEUANGAN) */}
      {activeSubTab === 'balance' && (
        <div className="space-y-6">
          {/* Balance Indicator Status */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isBalanceSheetBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isBalanceSheetBalanced ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {isBalanceSheetBalanced ? 'Neraca Seimbang (Balanced)' : 'Peringatan: Neraca Tidak Seimbang!'}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Total Aset: <span className="font-bold">{formatRupiah(totalAssets)}</span> = Total Kewajiban & Ekuitas:{' '}
                  <span className="font-bold">{formatRupiah(totalLiabilitiesAndEquity)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider block">Selisih:</span>
              <span className="text-sm font-black font-mono">
                {formatRupiah(Math.abs(totalAssets - totalLiabilitiesAndEquity))}
              </span>
            </div>
          </div>

          {/* Grid Neraca 2 Kolom (Aktiva vs Pasiva) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom Kiri: ASET (AKTIVA) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-brand-600" />
                  ASET LANCAR (AKTIVA)
                </h3>
                <span className="text-xs font-black text-brand-700">{formatRupiah(totalAssets)}</span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">1101</span>
                    <span className="font-semibold text-gray-800">Kas Toko</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(kas)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">1102</span>
                    <span className="font-semibold text-gray-800">Rekening Bank</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(bank)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">1103</span>
                    <span className="font-semibold text-gray-800">Piutang Usaha Pelanggan</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(piutang)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">1201</span>
                    <span className="font-semibold text-gray-800">Persediaan Barang Dagang</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(persediaan)}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-gray-900 flex justify-between text-sm font-black">
                <span>TOTAL ASET</span>
                <span className="text-brand-700">{formatRupiah(totalAssets)}</span>
              </div>
            </div>

            {/* Kolom Kanan: KEWAJIBAN & EKUITAS (PASIVA) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-600" />
                  KEWAJIBAN & EKUITAS (PASIVA)
                </h3>
                <span className="text-xs font-black text-brand-700">
                  {formatRupiah(totalLiabilitiesAndEquity)}
                </span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {/* Kewajiban */}
                <div className="py-2.5 flex justify-between items-center bg-gray-50/50 px-2 rounded-lg">
                  <span className="font-bold text-gray-600 uppercase text-[10px]">KEWAJIBAN JANGKA PENDEK</span>
                  <span className="font-bold text-gray-800">{formatRupiah(utang)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">2101</span>
                    <span className="font-semibold text-gray-800">Utang Usaha Supplier</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(utang)}</span>
                </div>

                {/* Ekuitas */}
                <div className="py-2.5 flex justify-between items-center bg-gray-50/50 px-2 rounded-lg">
                  <span className="font-bold text-gray-600 uppercase text-[10px]">EKUITAS PEMILIK TOKO</span>
                  <span className="font-bold text-gray-800">{formatRupiah(totalEquity)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">3101</span>
                    <span className="font-semibold text-gray-800">Modal Awal Pemilik</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(modal)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-400">3201</span>
                    <span className="font-semibold text-gray-800">Laba Ditahan</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(labaDitahan)}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center pl-4 bg-brand-50/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-brand-600 font-bold">L/R</span>
                    <span className="font-bold text-brand-900">Laba Bersih Tahun Berjalan</span>
                  </div>
                  <span className="font-black text-brand-700">{formatRupiah(netProfit)}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-gray-900 flex justify-between text-sm font-black">
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span className="text-brand-700">{formatRupiah(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JURNAL UMUM (GENERAL JOURNAL) */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no jurnal, referensi, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Tipe Mutasi:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'SALE', label: 'Penjualan' },
                  { id: 'COGS', label: 'HPP' },
                  { id: 'PURCHASE', label: 'Pengadaan' },
                  { id: 'PAYMENT', label: 'Pelunasan' },
                  { id: 'MANUAL', label: 'Manual' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setJournalFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      journalFilter === f.id
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Jurnal Umum */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Catatan Jurnal Umum Double-Entry ({filteredJournals.length})
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                Total Debet: {formatRupiah(filteredJournals.reduce((s, j) => s + Number(j.debit || 0), 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal & No. Jurnal</th>
                    <th className="py-3.5 px-4">Referensi</th>
                    <th className="py-3.5 px-4">Kode & Nama Akun</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Debet</th>
                    <th className="py-3.5 px-4 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJournals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Tidak ada entri jurnal akuntansi yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredJournals.map((j) => (
                      <tr key={j.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-xs text-gray-900">{j.entryNo}</div>
                          <div className="text-[10px] text-gray-400">{formatTanggal(j.date)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                            {j.refType}
                          </span>
                          <div className="text-[10px] font-mono text-gray-500 mt-0.5">{j.refNo}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-bold text-brand-700">{j.accountCode}</div>
                          <div className="font-medium text-gray-800 text-xs">{j.accountName}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                          {j.notes}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {Number(j.debit) > 0 ? formatRupiah(j.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {Number(j.credit) > 0 ? formatRupiah(j.credit) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUKU BESAR (GENERAL LEDGER) */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Pemilihan Akun */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Pilih Akun Buku Besar:</label>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                {coa.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.normalBalance})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-brand-50 border border-brand-200 px-4 py-2 rounded-xl text-xs font-bold text-brand-800">
              Saldo Akhir Akun: {formatRupiah(accountBalances.get(selectedLedgerAccount) || 0)}
            </div>
          </div>

          {/* Tabel Mutasi Buku Besar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900">
                Mutasi Buku Besar: {currentLedgerCoa?.code} - {currentLedgerCoa?.name} ({currentLedgerCoa?.normalBalance})
              </h3>
              <span className="text-xs text-gray-500">{computedLedgerLines.length} Transaksi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No. Jurnal</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debet</th>
                    <th className="py-3 px-4 text-right">Kredit</th>
                    <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {computedLedgerLines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Belum ada mutasi pembukuan pada akun ini.
                      </td>
                    </tr>
                  ) : (
                    computedLedgerLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-gray-600 text-xs">{formatTanggal(line.date)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-gray-900">{line.entryNo}</td>
                        <td className="py-3 px-4 text-xs text-gray-700">{line.notes}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-900">
                          {Number(line.debit) > 0 ? formatRupiah(line.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-900">
                          {Number(line.credit) > 0 ? formatRupiah(line.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-brand-700">
                          {formatRupiah(line.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BAGAN AKUN (CHART OF ACCOUNTS / COA) */}
      {activeSubTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Bagan Akun Standar SAK EMKM Indonesia
              </h3>
              <p className="text-xs text-gray-500">
                Struktur akun pembukuan baku untuk usaha mikro, kecil, dan menengah.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              10 Akun Baku Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Kode Akun</th>
                  <th className="py-3.5 px-4">Nama Akun</th>
                  <th className="py-3.5 px-4">Kelompok Akun</th>
                  <th className="py-3.5 px-4 text-center">Saldo Normal</th>
                  <th className="py-3.5 px-4 text-right">Saldo Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coa.map((account) => (
                  <tr key={account.code} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-brand-700 text-xs sm:text-sm">
                      {account.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{account.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {account.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          account.normalBalance === 'DEBIT'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {account.normalBalance}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-gray-900">
                      {formatRupiah(accountBalances.get(account.code) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: BUAT JURNAL UMUM MANUAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-400" />
                  Catat Jurnal Umum Manual
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gunakan untuk pengeluaran biaya operasional, prive, penambahan modal, atau koreksi pembukuan.
                </p>
              </div>
              <button
                onClick={() => setIsJournalModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveManualJournal} className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Keterangan Transaksi / Memo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran tagihan listrik & air toko bulan berjalan..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Baris Debet Kredit */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Baris Akun (Debet & Kredit)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddManualLine}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Baris Akun
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {manualLines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-gray-50/50 flex flex-col sm:flex-row gap-2.5 items-center">
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Akun</label>
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleManualLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-medium"
                        >
                          {coa.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Debet (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={line.debit || ''}
                          onChange={(e) => handleManualLineChange(idx, 'debit', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-right font-bold"
                        />
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Kredit (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={line.credit || ''}
                          onChange={(e) => handleManualLineChange(idx, 'credit', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-right font-bold"
                        />
                      </div>

                      <div className="pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveManualLine(idx)}
                          disabled={manualLines.length <= 2}
                          className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kalkulator Keseimbangan Jurnal */}
              <div
                className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                  isManualBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <span className="font-bold block">
                    {isManualBalanced ? '✓ Jurnal Seimbang (Balance)' : '⚠ Belum Seimbang!'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Debet: {formatRupiah(totalManualDebit)} | Kredit: {formatRupiah(totalManualCredit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold block">Selisih:</span>
                  <span className="font-mono font-black text-sm">
                    {formatRupiah(Math.abs(totalManualDebit - totalManualCredit))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || !isManualBalanced}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {loadingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
