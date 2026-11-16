/**
 * bilangan-3.js
 * Modul penanda hari "Bilangan 3" untuk semua tahun berdasarkan rumus siklus +2 hari per bulan.
 * Acuan: Januari 2026 = Jumat (indeks 5), maju 2 hari setiap pergantian bulan (mod 7).
 * Hari Bilangan 3 ditandai warna merah pada kalender.
 */

const Bilangan3Engine = (() => {
  // Mapping: 0=Ahad, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  const DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const BASE_YEAR = 2026;
  const BASE_MONTH = 1; // Januari
  const BASE_DOW = 5;   // Jumat

  /**
   * Menghitung indeks hari (0-6) untuk Bilangan 3 pada tahun & bulan (1-12) mana pun
   * Rumus: ((5 + ((year - 2026) * 12 + (month - 1)) * 2) % 7 + 7) % 7
   */
  function getTargetDayOfWeek(year, month) {
    if (typeof year !== 'number' || typeof month !== 'number' || month < 1 || month > 12) {
      return null;
    }
    const monthOffset = (year - BASE_YEAR) * 12 + (month - BASE_MONTH);
    return ((BASE_DOW + monthOffset * 2) % 7 + 7) % 7;
  }

  /**
   * Mendapatkan nama hari Bilangan 3 untuk tahun & bulan tertentu
   */
  function getTargetDayName(year, month) {
    const dow = getTargetDayOfWeek(year, month);
    return dow !== null ? DAY_NAMES[dow] : null;
  }

  /**
   * Mengecek apakah tanggal Masehi tertentu termasuk hari Bilangan 3
   */
  function isBilangan3(dateObj) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const targetDow = getTargetDayOfWeek(year, month);
    if (targetDow === null) return false;
    return dateObj.getDay() === targetDow;
  }

  return {
    DAY_NAMES,
    getTargetDayOfWeek,
    getTargetDayName,
    isBilangan3
  };
})();

if (typeof window !== 'undefined') {
  window.Bilangan3Engine = Bilangan3Engine;
}
