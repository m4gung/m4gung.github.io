import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../services/utils';
import { SyncEngine } from '../services/syncEngine';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import type { Attendance, Barber, AttendanceStatus } from '../types';

export const AttendancePage: React.FC = () => {
  const { showToast, settings } = useApp();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const bList = await db.barbers.filter(b => b.isActive).toArray();
      const aList = await db.attendances.where('date').equals(selectedDate).toArray();
      setBarbers(bList);
      setAttendances(aList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const openCheckInModal = (barber: Barber) => {
    const existing = attendances.find(a => a.barberId === barber.id);
    setSelectedBarber(barber);
    setStatus(existing ? existing.status : 'PRESENT');
    setNotes(existing?.notes || '');
    setIsModalOpen(true);
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
      const existing = attendances.find(a => a.barberId === selectedBarber.id);

      const attendanceId = existing ? existing.id : 'att_' + Date.now();
      const isPresent = status === 'PRESENT';
      const autoMeal = settings?.autoMealAllowanceOnAttendance ?? true;

      const record: Attendance = {
        id: attendanceId,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        date: selectedDate,
        checkInTime: existing?.checkInTime || timeStr,
        checkOutTime: existing ? timeStr : undefined,
        status,
        mealAllowanceGranted: isPresent && autoMeal,
        notes: notes.trim(),
        createdAt: existing?.createdAt || now.toISOString()
      };

      await db.attendances.put(record);

      // Jika otomatis beri uang makan, catat ke staff allowances
      if (isPresent && autoMeal) {
        const mealAmount = selectedBarber.dailyMealAllowance > 0
          ? selectedBarber.dailyMealAllowance
          : settings?.defaultDailyMealAllowance || 20000;

        await db.staffAllowances.put({
          id: 'meal_' + attendanceId,
          barberId: selectedBarber.id,
          barberName: selectedBarber.name,
          date: selectedDate,
          type: 'MEAL_ALLOWANCE',
          amount: mealAmount,
          notes: 'Uang makan otomatis dari absensi kehadiran',
          createdAt: now.toISOString()
        });
      } else if (!isPresent && existing) {
        // Hapus uang makan jika status diubah bukan HADIR
        await db.staffAllowances.delete('meal_' + attendanceId);
      }

      // Masukkan ke Outbox untuk re-sync
      await SyncEngine.addToOutbox('ATTENDANCE', existing ? 'UPDATE' : 'CREATE', record);

      await loadData();
      setIsModalOpen(false);
      showToast(`Absensi ${selectedBarber.name} (${status}) berhasil dicatat`, 'success');
    } catch (err: any) {
      showToast('Gagal mencatat absensi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (att: Attendance) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    try {
      await db.attendances.update(att.id, { checkOutTime: timeStr });
      await loadData();
      showToast(`Barber ${att.barberName} berhasil Check-Out pada ${timeStr}`, 'success');
    } catch (err: any) {
      showToast('Gagal check-out: ' + err.message, 'error');
    }
  };

  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-500" />
            Absensi Karyawan & Klaim Uang Makan
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pencatatan kehadiran harian barber (Hadir, Izin, Sakit, Alpa) dan otomatisasi uang makan.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-amber-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-neutral-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Stat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
          <span className="text-xs text-neutral-400 block">Total Barber Aktif</span>
          <span className="text-xl font-extrabold text-neutral-100 mt-1 block">{barbers.length} orang</span>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4">
          <span className="text-xs text-emerald-400 block">Hadir Hari Ini</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{presentCount} orang</span>
        </div>
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4">
          <span className="text-xs text-amber-400 block">Izin / Sakit</span>
          <span className="text-xl font-extrabold text-amber-400 mt-1 block">
            {attendances.filter(a => a.status === 'PERMIT' || a.status === 'SICK').length} orang
          </span>
        </div>
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4">
          <span className="text-xs text-rose-400 block">Belum Absen / Alpa</span>
          <span className="text-xl font-extrabold text-rose-400 mt-1 block">
            {barbers.length - attendances.length} orang
          </span>
        </div>
      </div>

      {/* Barber Attendance List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {barbers.map(barber => {
            const att = attendances.find(a => a.barberId === barber.id);
            const isPresent = att?.status === 'PRESENT';
            const mealAmount = barber.dailyMealAllowance > 0
              ? barber.dailyMealAllowance
              : settings?.defaultDailyMealAllowance || 20000;

            return (
              <div
                key={barber.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-700 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${
                      att
                        ? isPresent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {att ? (
                      isPresent ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      )
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-neutral-100">{barber.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {att ? (
                        <>
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : att.status === 'PERMIT'
                                ? 'bg-amber-500/20 text-amber-400'
                                : att.status === 'SICK'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {att.status === 'PRESENT'
                              ? 'HADIR'
                              : att.status === 'PERMIT'
                              ? 'IZIN'
                              : att.status === 'SICK'
                              ? 'SAKIT'
                              : 'ALPA'}
                          </span>

                          <span className="text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            Masuk: {att.checkInTime}
                            {att.checkOutTime && ` | Pulang: ${att.checkOutTime}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-500 italic">Belum melakukan absensi hari ini</span>
                      )}
                    </div>

                    {att?.mealAllowanceGranted && (
                      <span className="text-[11px] text-emerald-400 mt-1 block">
                        + Uang makan dialokasikan: {formatRupiah(mealAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {att && isPresent && !att.checkOutTime && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckOut(att)}
                    >
                      Check-Out
                    </Button>
                  )}

                  <Button
                    variant={att ? 'secondary' : 'gold'}
                    size="sm"
                    onClick={() => openCheckInModal(barber)}
                  >
                    {att ? 'Ubah Status' : 'Check-In Sekarang'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Check-In / Edit Status */}
      {isModalOpen && selectedBarber && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Absensi: {selectedBarber.name}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Pilih Status Kehadiran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PRESENT', label: 'Hadir (Masuk Kerja)' },
                    { id: 'PERMIT', label: 'Izin' },
                    { id: 'SICK', label: 'Sakit' },
                    { id: 'ABSENT', label: 'Alpa / Libur' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatus(item.id as AttendanceStatus)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        status === item.id
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === 'PRESENT' && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Otomatis mengklaim uang makan{' '}
                    <strong>
                      {formatRupiah(
                        selectedBarber.dailyMealAllowance > 0
                          ? selectedBarber.dailyMealAllowance
                          : settings?.defaultDailyMealAllowance || 20000
                      )}
                    </strong>{' '}
                    ke rekap gaji.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Catatan / Keterangan (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Masuk jam 10 pagi, izin ada urusan keluarga..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gold" isLoading={isSubmitting} loadingText="Menyimpan...">
                  Simpan Absensi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
