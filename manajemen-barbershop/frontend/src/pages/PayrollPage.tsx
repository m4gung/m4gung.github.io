import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import {
  BadgeDollarSign,
  Receipt,
  Plus,
  Calendar,
  TrendingUp,
  Gift,
  Utensils,
  MinusCircle,
  Printer,
  X
} from 'lucide-react';
import type { Barber, Transaction, StaffAllowance, Expense } from '../types';

export const PayrollPage: React.FC = () => {
  const { showToast } = useApp();

  // Active Sub-Tab: 'PAYROLL' vs 'EXPENSES'
  const [activeSubTab, setActiveSubTab] = useState<'PAYROLL' | 'EXPENSES'>('PAYROLL');

  // Master & Data State
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allowances, setAllowances] = useState<StaffAllowance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Filter Date Range (Default: Bulan Ini)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  // Modal Bonus / Tunjangan State
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [targetBarberId, setTargetBarberId] = useState('');
  const [allowanceType, setAllowanceType] = useState<StaffAllowance['type']>('TARGET_BONUS');
  const [allowanceAmount, setAllowanceAmount] = useState(50000);
  const [allowanceNotes, setAllowanceNotes] = useState('');

  // Modal Pengeluaran Toko State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('Listrik & Air');
  const [expenseAmount, setExpenseAmount] = useState(100000);
  const [expenseDescription, setExpenseDescription] = useState('');

  // Modal Slip Gaji Print View
  const [slipBarber, setSlipBarber] = useState<Barber | null>(null);

  const loadAllData = async () => {
    const bList = await db.barbers.filter(b => b.isActive).toArray();
    const tList = await db.transactions.where('status').equals('COMPLETED').toArray();
    const aList = await db.staffAllowances.toArray();
    const eList = await db.expenses.toArray();

    setBarbers(bList);
    setTransactions(tList);
    setAllowances(aList);
    setExpenses(eList);

    if (bList.length > 0 && !targetBarberId) {
      setTargetBarberId(bList[0].id);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter Data berdasarkan Rentang Tanggal
  const filteredTransactions = transactions.filter(t => {
    const d = t.createdAt.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const filteredAllowances = allowances.filter(a => {
    return a.date >= startDate && a.date <= endDate;
  });

  const filteredExpenses = expenses.filter(e => {
    return e.date >= startDate && e.date <= endDate;
  });

  // Perhitungan Komisi per Barber dari Snapshot Transaksi Selesai
  const getBarberPayrollSummary = (barber: Barber) => {
    // 1. Total Komisi dari Item Layanan
    let totalCommission = 0;
    let serviceCount = 0;

    filteredTransactions.forEach(tx => {
      tx.items.forEach(it => {
        if (it.type === 'SERVICE' && it.barberId === barber.id) {
          totalCommission += it.calculatedCommission || 0;
          serviceCount += it.quantity || 1;
        }
      });
    });

    // 2. Tunjangan & Bonus
    const barberAllowances = filteredAllowances.filter(a => a.barberId === barber.id);
    const mealAllowance = barberAllowances
      .filter(a => a.type === 'MEAL_ALLOWANCE')
      .reduce((sum, a) => sum + a.amount, 0);

    const bonuses = barberAllowances
      .filter(a => a.type === 'TARGET_BONUS' || a.type === 'ATTENDANCE_BONUS' || a.type === 'TIPS' || a.type === 'OTHER')
      .reduce((sum, a) => sum + a.amount, 0);

    const deductions = barberAllowances
      .filter(a => a.type === 'KASBON')
      .reduce((sum, a) => sum + a.amount, 0);

    const netSalary = totalCommission + mealAllowance + bonuses - deductions;

    return {
      serviceCount,
      totalCommission,
      mealAllowance,
      bonuses,
      deductions,
      netSalary,
      allowanceList: barberAllowances
    };
  };

  // Submit Tunjangan / Bonus
  const handleAddAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBarberId || allowanceAmount <= 0) {
      showToast('Data bonus/tunjangan belum lengkap', 'error');
      return;
    }

    const barber = barbers.find(b => b.id === targetBarberId);
    if (!barber) return;

    try {
      const record: StaffAllowance = {
        id: 'alw_' + Date.now(),
        barberId: barber.id,
        barberName: barber.name,
        date: new Date().toISOString().split('T')[0],
        type: allowanceType,
        amount: allowanceAmount,
        notes: allowanceNotes.trim(),
        createdAt: new Date().toISOString()
      };

      await db.staffAllowances.put(record);
      await loadAllData();
      setIsAllowanceModalOpen(false);
      setAllowanceNotes('');
      showToast(`Tunjangan/Bonus untuk ${barber.name} berhasil dicatat`, 'success');
    } catch (err: any) {
      showToast('Gagal mencatat tunjangan: ' + err.message, 'error');
    }
  };

  // Submit Pengeluaran Toko
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDescription.trim()) {
      showToast('Isi nominal dan keterangan pengeluaran dengan benar', 'error');
      return;
    }

    try {
      const newExpense: Expense = {
        id: 'exp_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: expenseCategory,
        amount: expenseAmount,
        description: expenseDescription.trim(),
        recordedBy: 'Owner/Admin',
        createdAt: new Date().toISOString()
      };

      await db.expenses.put(newExpense);
      await loadAllData();
      setIsExpenseModalOpen(false);
      setExpenseDescription('');
      showToast('Pengeluaran toko berhasil dicatat', 'success');
    } catch (err: any) {
      showToast('Gagal mencatat pengeluaran: ' + err.message, 'error');
    }
  };

  const totalExpenseAll = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-amber-500" />
            Komisi Barber, Penggajian & Pengeluaran Toko
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Rekap komisi transaksi cukur, uang makan absensi, bonus staf, dan biaya operasional.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('PAYROLL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'PAYROLL'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Payroll & Komisi Barber
          </button>
          <button
            onClick={() => setActiveSubTab('EXPENSES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'EXPENSES'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pengeluaran Toko
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-neutral-300">Periode:</span>
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

        {activeSubTab === 'PAYROLL' ? (
          <Button variant="gold" size="sm" onClick={() => setIsAllowanceModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Bonus / Kasbon
          </Button>
        ) : (
          <Button variant="gold" size="sm" onClick={() => setIsExpenseModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Catat Pengeluaran
          </Button>
        )}
      </div>

      {/* SUB-TAB 1: PAYROLL & KOMISI */}
      {activeSubTab === 'PAYROLL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map(barber => {
              const summary = getBarberPayrollSummary(barber);

              return (
                <div
                  key={barber.id}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
                        {barber.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-100 text-sm">{barber.name}</h3>
                        <span className="text-[11px] text-neutral-400">
                          {summary.serviceCount} layanan dikerjakan
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSlipBarber(barber)}
                      title="Cetak Slip Gaji"
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rincian Komponen */}
                  <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        Komisi Cukur:
                      </span>
                      <span className="font-bold text-neutral-200">
                        {formatRupiah(summary.totalCommission)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                        Uang Makan (Absensi):
                      </span>
                      <span className="font-bold text-neutral-200">
                        {formatRupiah(summary.mealAllowance)}
                      </span>
                    </div>

                    {summary.bonuses > 0 && (
                      <div className="flex justify-between items-center text-neutral-400">
                        <span className="flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-blue-400" />
                          Bonus / Tips:
                        </span>
                        <span className="font-bold text-blue-400">
                          +{formatRupiah(summary.bonuses)}
                        </span>
                      </div>
                    )}

                    {summary.deductions > 0 && (
                      <div className="flex justify-between items-center text-neutral-400">
                        <span className="flex items-center gap-1.5">
                          <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
                          Kasbon / Potongan:
                        </span>
                        <span className="font-bold text-rose-400">
                          -{formatRupiah(summary.deductions)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total Diterima */}
                  <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-400">Total Diterima:</span>
                    <span className="text-base font-black text-amber-400">
                      {formatRupiah(summary.netSalary)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PENGELUARAN TOKO */}
      {activeSubTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Total Pengeluaran Periode Ini:</span>
            <span className="text-xl font-extrabold text-rose-400">{formatRupiah(totalExpenseAll)}</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
              <Receipt className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Belum ada pengeluaran operasional pada periode ini.</p>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-neutral-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {exp.category}
                      </span>
                      <span className="text-xs text-neutral-400">{exp.date}</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-100 mt-1">{exp.description}</p>
                  </div>
                  <span className="text-sm font-extrabold text-rose-400">{formatRupiah(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH BONUS / KASBON */}
      {isAllowanceModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Catat Bonus / Kasbon Karyawan
              </h3>
              <button onClick={() => setIsAllowanceModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAllowance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Pilih Barber:</label>
                <select
                  value={targetBarberId}
                  onChange={e => setTargetBarberId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Jenis Kompensasi:</label>
                <select
                  value={allowanceType}
                  onChange={e => setAllowanceType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="TARGET_BONUS">Bonus Target Transaksi</option>
                  <option value="ATTENDANCE_BONUS">Bonus Kerajinan / Kehadiran Penuh</option>
                  <option value="TIPS">Tips Pelanggan (Titipan)</option>
                  <option value="KASBON">Kasbon / Potongan Gaji</option>
                  <option value="OTHER">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  required
                  value={allowanceAmount}
                  onChange={e => setAllowanceAmount(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Keterangan / Catatan:</label>
                <input
                  type="text"
                  placeholder="Misal: Bonus capai 50 kepala bulan ini"
                  value={allowanceNotes}
                  onChange={e => setAllowanceNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsAllowanceModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold">
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT PENGELUARAN */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Catat Pengeluaran Operasional Toko
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Kategori Pengeluaran:</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="Listrik & Air">Listrik & Air</option>
                  <option value="Sewa Tempat">Sewa Tempat</option>
                  <option value="Perlengkapan Cukur">Perlengkapan Cukur (Silet/Bedak/Handuk)</option>
                  <option value="Kebersihan & Konsumsi">Kebersihan & Konsumsi</option>
                  <option value="Internet / Wifi">Internet / Wifi</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nominal Pengeluaran (Rp):</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Deskripsi / Catatan:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bayar tagihan token listrik 100k"
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold">
                  Simpan Pengeluaran
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIP GAJI DIALOG PRINT VIEW */}
      {slipBarber && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Slip Gaji: {slipBarber.name}
              </h3>
              <button onClick={() => setSlipBarber(null)} className="p-1 text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const s = getBarberPayrollSummary(slipBarber);
              return (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                    <p className="text-neutral-400">Periode: <strong className="text-neutral-200">{startDate} s/d {endDate}</strong></p>
                    <p className="text-neutral-400">Layanan Dikerjakan: <strong className="text-neutral-200">{s.serviceCount} kepala</strong></p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-neutral-300">
                      <span>Komisi Layanan Cukur:</span>
                      <span className="font-bold">{formatRupiah(s.totalCommission)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-300">
                      <span>Uang Makan (Kehadiran):</span>
                      <span className="font-bold">{formatRupiah(s.mealAllowance)}</span>
                    </div>
                    {s.bonuses > 0 && (
                      <div className="flex justify-between text-blue-400">
                        <span>Bonus & Tunjangan:</span>
                        <span className="font-bold">+{formatRupiah(s.bonuses)}</span>
                      </div>
                    )}
                    {s.deductions > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Potongan / Kasbon:</span>
                        <span className="font-bold">-{formatRupiah(s.deductions)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-800 flex justify-between text-sm font-extrabold text-amber-400">
                      <span>Total Bersih Diterima:</span>
                      <span className="text-base">{formatRupiah(s.netSalary)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" size="md" className="flex-1" onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-1.5" />
                      Cetak Slip
                    </Button>
                    <Button variant="outline" size="md" className="flex-1" onClick={() => setSlipBarber(null)}>
                      Tutup
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
