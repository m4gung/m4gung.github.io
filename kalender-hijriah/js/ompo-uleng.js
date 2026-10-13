/**
 * ompo-uleng.js
 * Implementasi Matriks Kalender Tradisi Bugis "Ompo Uleng"
 * berdasarkan gambar referensi kalender-hijriah.jpg
 * 
 * Klasifikasi 5 status waktu berdasarkan tanggal Hijriah (mod 5)
 * dan 5 pembagian rentang jam (Pagi, Siang 1, Siang 2, Siang 3, Sore).
 */

const OmpoUlengEngine = (() => {
  // 5 Status & Simbol Hijaiyah beserta arti dan representasi warna
  const STATUS = {
    HIDUP: {
      key: 'hidup',
      huruf: 'ا',
      nama: 'Hidup',
      warnaBg: '#22c55e',      // Hijau
      warnaText: '#ffffff',
      badgeClass: 'status-hidup',
      makna: 'Waktu yang sangat baik, penuh berkah, kehidupan, kelancaran hajat, keberuntungan, dan kesuksesan ikhtiar.',
      anjuran: 'Sangat direkomendasikan untuk memulai usaha baru, bepergian, akad nikah, transaksi penting, atau menanam.'
    },
    MATI: {
      key: 'mati',
      huruf: 'ل',
      nama: 'Mati',
      warnaBg: '#111827',      // Hitam
      warnaText: '#ffffff',
      badgeClass: 'status-mati',
      makna: 'Waktu pantangan/kurang baik. Energi melemah, berpotensi menemui kegagalan atau hambatan berat jika memaksakan kehendak.',
      anjuran: 'Hindari memulai pekerjaan besar atau bepergian jauh. Dianjurkan memperbanyak doa, istirahat, dan waspada.'
    },
    BERISI: {
      key: 'berisi',
      huruf: 'ج',
      nama: 'Berisi',
      warnaBg: '#eab308',      // Kuning
      warnaText: '#1f2937',
      badgeClass: 'status-berisi',
      makna: 'Waktu yang padat, berisi rezeki, berbobot, dan menguntungkan secara materiil maupun spiritual.',
      anjuran: 'Sangat baik untuk berdagang, menagih/membayar utang, memanen, berinvestasi, dan negosiasi kerja sama.'
    },
    BERDARAH: {
      key: 'berdarah',
      huruf: 'م',
      nama: 'Berdarah',
      warnaBg: '#ef4444',      // Merah
      warnaText: '#ffffff',
      badgeClass: 'status-berdarah',
      makna: 'Waktu yang rawan perselisihan, gesekan, bahaya fisik, luka, atau kerugian emosional.',
      anjuran: 'Jaga lisan dan emosi, hindari pertikaian, operasi non-darurat jika memungkinkan, dan tunda kesepakatan sensitif.'
    },
    KOSONG: {
      key: 'kosong',
      huruf: 'د',
      nama: 'Kosong',
      warnaBg: '#06b6d4',      // Biru Muda
      warnaText: '#ffffff',
      badgeClass: 'status-kosong',
      makna: 'Waktu hampa, sia-sia, atau netral. Apa yang diusahakan cenderung nihil atau kurang membuahkan hasil nyata.',
      anjuran: 'Cocok untuk kegiatan rutin tanpa target besar atau rileks. Kurang cocok meminta bantuan penting atau berburu laba.'
    }
  };

  // 5 Pembagian Rentang Jam (Pagi s/d Sore)
  const TIME_SLOTS = [
    {
      id: 'pagi',
      nama: 'Pagi',
      jamLabel: '6 - 9',
      startHour: 6,
      endHour: 9,
      slotIndex: 0
    },
    {
      id: 'siang_1',
      nama: 'Siang (9-11)',
      jamLabel: '9 - 11',
      startHour: 9,
      endHour: 11,
      slotIndex: 1
    },
    {
      id: 'siang_2',
      nama: 'Siang (11-1)',
      jamLabel: '11 - 1',
      startHour: 11,
      endHour: 13,
      slotIndex: 2
    },
    {
      id: 'siang_3',
      nama: 'Siang (1-3)',
      jamLabel: '1 - 3',
      startHour: 13,
      endHour: 15,
      slotIndex: 3
    },
    {
      id: 'sore',
      nama: 'Sore',
      jamLabel: '3 - 6',
      startHour: 15,
      endHour: 18,
      slotIndex: 4
    }
  ];

  /**
   * MATRIKS PERSIS DARI GAMBAR kalender-hijriah.jpg:
   * 
   * Baris 1: Tgl 1, 6, 11, 16, 21, 26
   *   Pagi (6-9):   ا (Hidup)
   *   Siang (9-11):  ل (Mati)
   *   Siang (11-1):  ج (Berisi)
   *   Siang (1-3):   م (Berdarah)
   *   Sore (3-6):    د (Kosong)
   * 
   * Baris 2: Tgl 2, 7, 12, 17, 22, 27
   *   Pagi (6-9):   د (Kosong)
   *   Siang (9-11):  ا (Hidup)
   *   Siang (11-1):  ل (Mati)
   *   Siang (1-3):   ج (Berisi)
   *   Sore (3-6):    م (Berdarah)
   * 
   * Baris 3: Tgl 3, 8, 13, 18, 23, 28
   *   Pagi (6-9):   م (Berdarah)
   *   Siang (9-11):  د (Kosong)
   *   Siang (11-1):  ا (Hidup)
   *   Siang (1-3):   ل (Mati)
   *   Sore (3-6):    ج (Berisi)
   * 
   * Baris 4: Tgl 4, 9, 14, 19, 24, 29
   *   Pagi (6-9):   ج (Berisi)
   *   Siang (9-11):  م (Berdarah)
   *   Siang (11-1):  د (Kosong)
   *   Siang (1-3):   ا (Hidup)
   *   Sore (3-6):    ل (Mati)
   * 
   * Baris 5: Tgl 5, 10, 15, 20, 25, 30
   *   Pagi (6-9):   ل (Mati)
   *   Siang (9-11):  ج (Berisi)
   *   Siang (11-1):  م (Berdarah)
   *   Siang (1-3):   د (Kosong)
   *   Sore (3-6):    ا (Hidup)
   */
  const MATRIX = [
    // Baris 1 (index 0)
    [STATUS.HIDUP, STATUS.MATI, STATUS.BERISI, STATUS.BERDARAH, STATUS.KOSONG],
    // Baris 2 (index 1)
    [STATUS.KOSONG, STATUS.HIDUP, STATUS.MATI, STATUS.BERISI, STATUS.BERDARAH],
    // Baris 3 (index 2)
    [STATUS.BERDARAH, STATUS.KOSONG, STATUS.HIDUP, STATUS.MATI, STATUS.BERISI],
    // Baris 4 (index 3)
    [STATUS.BERISI, STATUS.BERDARAH, STATUS.KOSONG, STATUS.HIDUP, STATUS.MATI],
    // Baris 5 (index 4)
    [STATUS.MATI, STATUS.BERISI, STATUS.BERDARAH, STATUS.KOSONG, STATUS.HIDUP]
  ];

  /**
   * Mendapatkan index baris (0 - 4) dari tanggal Hijriah (1 - 30)
   */
  function getRowIndex(hijriDay) {
    const day = parseInt(hijriDay, 10) || 1;
    // (day - 1) % 5 menghasilkan 0 untuk tgl 1, 6, 11... ; 1 untuk tgl 2, 7, 12...
    return ((day - 1) % 5 + 5) % 5;
  }

  /**
   * Mendapatkan jadwal lengkap Ompo Uleng untuk suatu tanggal Hijriah
   */
  function getDailySchedule(hijriDay) {
    const rowIndex = getRowIndex(hijriDay);
    const statuses = MATRIX[rowIndex];

    return TIME_SLOTS.map((slot, idx) => {
      const statusObj = statuses[idx];
      return {
        slotId: slot.id,
        namaWaktu: slot.nama,
        jamLabel: slot.jamLabel,
        startHour: slot.startHour,
        endHour: slot.endHour,
        status: statusObj
      };
    });
  }

  /**
   * Mengetahui slot dan status saat ini berdasarkan jam realtime (0-23)
   */
  function getCurrentStatus(hijriDay, currentHour = null) {
    const hour = currentHour !== null ? currentHour : new Date().getHours();
    const schedule = getDailySchedule(hijriDay);

    // Cari slot yang cocok
    let matchedSlot = schedule.find(s => hour >= s.startHour && hour < s.endHour);

    let isNight = false;
    let nightInfo = null;

    // Jika jam sebelum 06:00 atau setelah 18:00 (malam hari)
    if (!matchedSlot) {
      isNight = true;
      if (hour >= 18 || hour < 6) {
        nightInfo = 'Waktu Malam (18:00 - 06:00). Tradisi Ompo Uleng fokus pada siang hari (Pagi s/d Sore). Malam adalah waktu istirahat, tilawah, dan ibadah.';
      }
    }

    return {
      currentHour: hour,
      hijriDay,
      rowIndex: getRowIndex(hijriDay) + 1, // 1-indexed baris
      isNight,
      nightInfo,
      activeSlot: matchedSlot || null,
      activeStatus: matchedSlot ? matchedSlot.status : null,
      fullSchedule: schedule
    };
  }

  /**
   * Mendapatkan status spesifik untuk tanggal Hijriah & jam tertentu
   */
  function getStatusAt(hijriDay, hour) {
    const schedule = getDailySchedule(hijriDay);
    const slot = schedule.find(s => hour >= s.startHour && hour < s.endHour);
    return slot ? slot.status : null;
  }

  /**
   * Daftar tanggal Hijriah yang berwarna kuning/oranye pada tabel referensi kalender-hijriah.jpg:
   * Baris 1: 26, 6
   * Baris 2: 22, 2
   * Baris 3: 18
   * Baris 4: 14
   * Baris 5: 30, 10
   */
  const HIGHLIGHTED_DAYS = [26, 6, 22, 2, 18, 14, 30, 10];

  function isHighlightedDate(hijriDay) {
    const day = parseInt(hijriDay, 10);
    return HIGHLIGHTED_DAYS.includes(day);
  }

  return {
    STATUS,
    TIME_SLOTS,
    HIGHLIGHTED_DAYS,
    isHighlightedDate,
    getRowIndex,
    getDailySchedule,
    getCurrentStatus,
    getStatusAt
  };
})();

if (typeof window !== 'undefined') {
  window.OmpoUlengEngine = OmpoUlengEngine;
}
