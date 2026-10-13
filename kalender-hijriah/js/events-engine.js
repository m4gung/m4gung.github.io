/**
 * events-engine.js
 * Manajemen agenda/rencana (CRUD) dengan dukungan perulangan canggih:
 * - Sekali saja (none)
 * - Harian (daily)
 * - Mingguan (weekly pada hari tertentu, misal: tiap Kamis / malam Jumat)
 * - Bulanan Masehi (monthly_gregorian misal tiap tanggal 25)
 * - Bulanan Hijriah (monthly_hijri misal tiap tanggal 1 Hijriah, atau Puasa Ayyamul Bidh 13, 14, 15)
 * - Pasaran Weton (pasaran misal tiap Jumat Kliwon, Kamis Wage)
 * - Status Ompo Uleng (misal agenda yang diprioritaskan saat jam Hidup atau Berisi)
 */

const EventsEngine = (() => {
  const STORAGE_KEY = 'kalender_hijriah_events';
  let events = [];

  function loadEvents() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          events = JSON.parse(data);
          return;
        }
      }
      // Sample preset events
      events = [
        {
          id: 'preset-1',
          title: 'Puasa Ayyamul Bidh',
          category: 'ibadah',
          repeatType: 'hijri_ayyamul_bidh', // tgl 13, 14, 15 Hijriah tiap bulan
          color: '#10b981',
          notes: 'Puasa sunnah pertengahan bulan Hijriah'
        },
        {
          id: 'preset-2',
          title: 'Puasa Senin & Kamis',
          category: 'ibadah',
          repeatType: 'weekly_senin_kamis', // tiap Senin & Kamis
          color: '#3b82f6',
          notes: 'Puasa sunnah mingguan'
        }
      ];
      if (typeof window !== 'undefined' && window.localStorage) {
        saveEvents();
      }
    } catch (e) {
      console.warn('Gagal memuat events:', e);
      events = [];
    }
  }

  function saveEvents() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      }
    } catch (e) {
      console.error('Gagal menyimpan events:', e);
    }
  }

  loadEvents();

  function getAllEvents() {
    return [...events];
  }

  function addEvent(eventData) {
    const newEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      ...eventData
    };
    events.push(newEvent);
    saveEvents();
    return newEvent;
  }

  function updateEvent(id, updatedData) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...updatedData, updatedAt: new Date().toISOString() };
      saveEvents();
      return events[idx];
    }
    return null;
  }

  function deleteEvent(id) {
    events = events.filter(e => e.id !== id);
    saveEvents();
  }

  /**
   * Mengecek apakah sebuah event berlaku pada tanggal & konteks tertentu
   * @param {Object} event
   * @param {Object} context { gDate, gYear, gMonth, gDay, hYear, hMonth, hDay, dayOfWeek, weton, pasaran }
   */
  function isEventActiveOn(event, context) {
    const { gDate, gYear, gMonth, gDay, hYear, hMonth, hDay, dayOfWeek, weton, pasaran } = context;

    switch (event.repeatType) {
      case 'none': // Sekali saja pada tanggal Masehi tertentu
        if (event.targetDate) {
          const tDate = new Date(event.targetDate);
          return (
            tDate.getFullYear() === gYear &&
            tDate.getMonth() + 1 === gMonth &&
            tDate.getDate() === gDay
          );
        }
        return false;

      case 'daily':
        return true;

      case 'weekly': // Tiap hari tertentu dalam sepekan (0=Ahad, 1=Senin, ..., 6=Sabtu)
        if (Array.isArray(event.daysOfWeek)) {
          return event.daysOfWeek.includes(dayOfWeek);
        }
        return event.dayOfWeek === dayOfWeek;

      case 'weekly_senin_kamis': // Preset puasa Senin Kamis
        return dayOfWeek === 1 || dayOfWeek === 4;

      case 'monthly_gregorian': // Tiap tanggal Masehi tertentu (1-31)
        return parseInt(event.monthlyDay, 10) === gDay;

      case 'monthly_hijri': // Tiap tanggal Hijriah tertentu (1-30)
        return parseInt(event.hijriDay, 10) === hDay;

      case 'hijri_ayyamul_bidh': // Preset tgl 13, 14, 15 Hijriah
        return hDay === 13 || hDay === 14 || hDay === 15;

      case 'yearly_gregorian': // Tiap tahun tanggal & bulan Masehi yang sama (Ulang Tahun / Peringatan)
        return parseInt(event.gregorianMonth, 10) === gMonth && parseInt(event.gregorianDay, 10) === gDay;

      case 'yearly_hijri': // Tiap tahun tanggal & bulan Hijriah yang sama (Milad Hijriah / Haul Ulama)
        return parseInt(event.hijriMonth, 10) === hMonth && parseInt(event.hijriDay, 10) === hDay;

      case 'pasaran': // Tiap weton tertentu, misal 'Jumat Kliwon' atau pasaran 'Kliwon'
        if (event.targetWeton) {
          return weton.toLowerCase().includes(event.targetWeton.toLowerCase());
        }
        if (event.targetPasaran) {
          return pasaran.toLowerCase() === event.targetPasaran.toLowerCase();
        }
        return false;

      case 'ompo_status': // Berlaku pada hari yang memiliki jam status tertentu (misal tgl yang memiliki jam Hidup di pagi hari)
        return true;

      default:
        return false;
    }
  }

  /**
   * Mengambil semua event yang aktif pada tanggal tertentu
   */
  function getEventsForDate(context) {
    return events.filter(e => isEventActiveOn(e, context));
  }

  return {
    getAllEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    loadEvents
  };
})();

if (typeof window !== 'undefined') {
  window.EventsEngine = EventsEngine;
}
