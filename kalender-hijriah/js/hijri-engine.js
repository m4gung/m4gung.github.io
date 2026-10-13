/**
 * hijri-engine.js
 * Modul konversi kalender Masehi (Gregorian) ke Hijriah dan sebaliknya,
 * dilengkapi dukungan penyesuaian offset rukyat/hisab (+/- hari)
 * serta opsi waktu pergantian hari Hijriah (Maghrib).
 */

const HijriEngine = (() => {
  const HIJRI_MONTHS = [
    { id: 1, name: 'Muharram', ar: 'مُحَرَّم' },
    { id: 2, name: 'Safar', ar: 'صَفَر' },
    { id: 3, name: 'Rabiul Awwal', ar: 'رَبِيع ٱلْأَوَّل' },
    { id: 4, name: 'Rabiul Akhir', ar: 'رَبِيع ٱلْآخِر' },
    { id: 5, name: 'Jumadil Ula', ar: 'جُمَادَىٰ ٱلْأُولَىٰ' },
    { id: 6, name: 'Jumadil Akhir', ar: 'جُمَادَىٰ ٱلْآخِرَة' },
    { id: 7, name: 'Rajab', ar: 'رَجَب' },
    { id: 8, name: 'Sya\'ban', ar: 'شَعْبَان' },
    { id: 9, name: 'Ramadhan', ar: 'رَمَضَان' },
    { id: 10, name: 'Syawwal', ar: 'شَوَّال' },
    { id: 11, name: 'Dzulqa\'dah', ar: 'ذُو ٱلْقَعْدَة' },
    { id: 12, name: 'Dzulhijjah', ar: 'ذُو ٱلْحِجَّة' }
  ];

  const GREGORIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const DAYS_ID = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Pengaturan default
  let userOffset = 0; // +/- hari
  let switchAtMaghrib = true;
  let maghribHour = 18; // default jam 18:00

  function initSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('kalender_hijriah_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.offset === 'number') userOffset = parsed.offset;
          if (typeof parsed.switchAtMaghrib === 'boolean') switchAtMaghrib = parsed.switchAtMaghrib;
          if (typeof parsed.maghribHour === 'number') maghribHour = parsed.maghribHour;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat pengaturan lokal:', e);
    }
  }

  initSettings();

  function saveSettings(newSettings) {
    if (typeof newSettings.offset === 'number') userOffset = newSettings.offset;
    if (typeof newSettings.switchAtMaghrib === 'boolean') switchAtMaghrib = newSettings.switchAtMaghrib;
    if (typeof newSettings.maghribHour === 'number') maghribHour = newSettings.maghribHour;
    localStorage.setItem('kalender_hijriah_settings', JSON.stringify({
      offset: userOffset,
      switchAtMaghrib: switchAtMaghrib,
      maghribHour: maghribHour
    }));
  }

  function getSettings() {
    return {
      offset: userOffset,
      switchAtMaghrib,
      maghribHour
    };
  }

  /**
   * Konversi tanggal Masehi ke Julian Day Number (JDN)
   */
  function gregorianToJDN(year, month, day) {
    let m = month;
    let y = year;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  }

  /**
   * Konversi Julian Day Number (JDN) ke tanggal Masehi
   */
  function jdnToGregorian(jdn) {
    const jd = jdn + 0.5;
    const z = Math.floor(jd);
    const f = jd - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const day = Math.floor(b - d - Math.floor(30.6001 * e) + f);
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    return { year, month, day };
  }

  /**
   * Algoritma Kuwait / Standar Astronomis Tabular Hijri
   * Mengubah JDN ke Hijriah
   */
  function jdnToHijri(jdn) {
    const l = Math.floor(jdn - 1948439.5) + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) +
              (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
               (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return {
      year,
      month,
      day
    };
  }

  /**
   * Konversi Hijriah ke JDN
   */
  function hijriToJDN(year, month, day) {
    return Math.floor((11 * year + 3) / 30) + 354 * year + 30 * month -
           Math.floor((month - 1) / 2) + day + 1948440 - 385;
  }

  /**
   * Konversi Date objek atau (Y, M, D, hour) ke Hijriah dengan offset & aturan Maghrib
   */
  function fromGregorian(dateInput, customOffset = null, considerTime = true) {
    let date;
    if (dateInput instanceof Date) {
      date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }

    const offsetToApply = customOffset !== null ? customOffset : userOffset;

    let dayShift = offsetToApply;
    // Cek apakah waktu saat ini sudah lewat Maghrib pada hari tersebut
    if (considerTime && switchAtMaghrib) {
      const currentHour = date.getHours();
      if (currentHour >= maghribHour) {
        dayShift += 1;
      }
    }

    const y = date.getFullYear();
    const m = date.getMonth() + 1; // 1-12
    const d = date.getDate();

    let jdn = gregorianToJDN(y, m, d) + dayShift;
    const hijri = jdnToHijri(jdn);

    // Amankan range hari Hijriah (1 - 30)
    let hDay = hijri.day;
    let hMonth = hijri.month;
    let hYear = hijri.year;

    if (hDay < 1) hDay = 1;
    if (hDay > 30) hDay = 30;

    const monthObj = HIJRI_MONTHS[hMonth - 1] || HIJRI_MONTHS[0];

    return {
      hijriDay: hDay,
      hijriMonth: hMonth,
      hijriYear: hYear,
      hijriMonthName: monthObj.name,
      hijriMonthArabic: monthObj.ar,
      gregorianDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      dayOfWeek: date.getDay(), // 0 = Ahad
      dayName: DAYS_ID[date.getDay()],
      offsetUsed: offsetToApply,
      isAfterMaghrib: considerTime && switchAtMaghrib && (date.getHours() >= maghribHour)
    };
  }

  /**
   * Menghitung jumlah hari dalam bulan Masehi
   */
  function getDaysInGregorianMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Cari perkiraan tanggal Masehi dari tanggal Hijriah tertentu
   */
  function toGregorian(hYear, hMonth, hDay, customOffset = null) {
    const offsetToApply = customOffset !== null ? customOffset : userOffset;
    const jdn = hijriToJDN(hYear, hMonth, hDay) - offsetToApply;
    const g = jdnToGregorian(jdn);
    return new Date(g.year, g.month - 1, g.day);
  }

  return {
    HIJRI_MONTHS,
    GREGORIAN_MONTHS,
    DAYS_ID,
    fromGregorian,
    toGregorian,
    getDaysInGregorianMonth,
    saveSettings,
    getSettings
  };
})();

// Eksport jika di lingkungan modul atau window
if (typeof window !== 'undefined') {
  window.HijriEngine = HijriEngine;
}
