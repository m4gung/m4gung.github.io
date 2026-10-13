/**
 * holidays.js
 * Daftar Hari Libur Nasional & Hari Besar Keagamaan / Islam
 */

const HolidaysData = (() => {
  // Hari Besar Islam berdasarkan kalender Hijriah (Bulan, Hari)
  const ISLAMIC_HOLIDAYS = [
    { month: 1, day: 1, name: 'Tahun Baru Islam (1 Muharram)', desc: 'Awal tahun baru kalender Hijriah.' },
    { month: 1, day: 9, name: 'Puasa Tasu\'a (9 Muharram)', desc: 'Puasa sunnah penyerta puasa Asyura.' },
    { month: 1, day: 10, name: 'Hari Asyura (10 Muharram)', desc: 'Puasa sunnah Asyura yang sangat utama.' },
    { month: 3, day: 12, name: 'Maulid Nabi Muhammad SAW', desc: 'Peringatan kelahiran Rasulullah SAW (12 Rabiul Awwal).' },
    { month: 7, day: 27, name: 'Isra Mi\'raj', desc: 'Peringatan perjalanan suci Nabi Muhammad SAW (27 Rajab).' },
    { month: 8, day: 15, name: 'Malam Nisfu Sya\'ban', desc: 'Malam penuh ampunan dan keberkahan (15 Sya\'ban).' },
    { month: 9, day: 1, name: 'Awal Ramadhan', desc: 'Permulaan ibadah puasa wajib di bulan suci Ramadhan.' },
    { month: 9, day: 17, name: 'Nuzulul Qur\'an', desc: 'Peringatan turunnya ayat suci Al-Qur\'an pertama kali.' },
    { month: 10, day: 1, name: 'Hari Raya Idul Fitri (1 Syawwal)', desc: 'Hari raya kemenangan umat Islam.' },
    { month: 10, day: 2, name: 'Hari Raya Idul Fitri Hari Ke-2', desc: 'Silaturahmi dan perayaan Idul Fitri.' },
    { month: 12, day: 9, name: 'Hari Arafah (9 Dzulhijjah)', desc: 'Puncak ibadah haji & puasa Arafah bagi yang tidak berhaji.' },
    { month: 12, day: 10, name: 'Hari Raya Idul Adha (10 Dzulhijjah)', desc: 'Hari raya kurban bagi umat Islam.' },
    { month: 12, day: 11, name: 'Hari Tasyrik 1 (11 Dzulhijjah)', desc: 'Hari menyembelih kurban, dilarang berpuasa.' },
    { month: 12, day: 12, name: 'Hari Tasyrik 2 (12 Dzulhijjah)', desc: 'Hari menyembelih kurban, dilarang berpuasa.' },
    { month: 12, day: 13, name: 'Hari Tasyrik 3 (13 Dzulhijjah)', desc: 'Hari menyembelih kurban, dilarang berpuasa.' }
  ];

  // Hari Libur Tetap Masehi (Bulan 1-12, Hari)
  const FIXED_GREGORIAN_HOLIDAYS = [
    { month: 1, day: 1, name: 'Tahun Baru Masehi' },
    { month: 5, day: 1, name: 'Hari Buruh Internasional' },
    { month: 6, day: 1, name: 'Hari Lahir Pancasila' },
    { month: 8, day: 17, name: 'Hari Kemerdekaan RI' },
    { month: 12, day: 25, name: 'Hari Raya Natal' }
  ];

  function getIslamicHoliday(hMonth, hDay) {
    return ISLAMIC_HOLIDAYS.find(h => h.month === hMonth && h.day === hDay) || null;
  }

  function getGregorianHoliday(gMonth, gDay) {
    return FIXED_GREGORIAN_HOLIDAYS.find(h => h.month === gMonth && h.day === gDay) || null;
  }

  function getHoliday(hMonth, hDay, gMonth, gDay) {
    const islamic = getIslamicHoliday(hMonth, hDay);
    if (islamic) return { ...islamic, isIslamic: true };
    const gregorian = getGregorianHoliday(gMonth, gDay);
    if (gregorian) return { ...gregorian, isIslamic: false };
    return null;
  }

  return {
    ISLAMIC_HOLIDAYS,
    FIXED_GREGORIAN_HOLIDAYS,
    getIslamicHoliday,
    getGregorianHoliday,
    getHoliday
  };
})();

if (typeof window !== 'undefined') {
  window.HolidaysData = HolidaysData;
}
