/**
 * primbon-engine.js
 * Modul perhitungan Pasaran Jawa (Weton), Nilai Neptu, dan Karakteristik Hari Primbon
 */

const PrimbonEngine = (() => {
  // 5 Pasaran Jawa
  const PASARAN = [
    { nama: 'Legi', neptu: 5, arah: 'Timur', elemen: 'Kayu' },
    { nama: 'Pahing', neptu: 9, arah: 'Selatan', elemen: 'Api' },
    { nama: 'Pon', neptu: 7, arah: 'Barat', elemen: 'Logam' },
    { nama: 'Wage', neptu: 4, arah: 'Utara', elemen: 'Air' },
    { nama: 'Kliwon', neptu: 8, arah: 'Tengah', elemen: 'Tanah' }
  ];

  // 7 Hari Saptawara & Neptu
  const HARI = [
    { nama: 'Ahad', neptu: 5 },
    { nama: 'Senin', neptu: 4 },
    { nama: 'Selasa', neptu: 3 },
    { nama: 'Rabu', neptu: 7 },
    { nama: 'Kamis', neptu: 8 },
    { nama: 'Jumat', neptu: 6 },
    { nama: 'Sabtu', neptu: 9 }
  ];

  // Karakteristik & Watak dasar berdasarkan jumlah Neptu
  const WATAK_NEPTU = {
    7: 'Pendito Kang Lelaku: Senang bepergian jauh, suka merantau, cenderung pemalu namun tekun.',
    8: 'Lakuning Geni: Mudah emosi, berapi-api namun setia kawan dan pemberani.',
    9: 'Lakuning Angin: Mudah dipengaruhi, ramah, pandai mengambil hati sesama, lincah.',
    10: 'Pendito Mbangun Teki: Suka menolong, cerdas, tidak mudah putus asa, gemar menuntut ilmu.',
    11: 'Lakuning Setan: Berkarakter kuat, berjiwa pemberontak positif, tidak suka diatur sepihak.',
    12: 'Lakuning Kembang: Penyejuk suasana, cinta damai, disukai banyak orang, berjiwa artistik.',
    13: 'Lakuning Lintang: Suka menyendiri, berjiwa petualang, jujur, dan memiliki intuisi tajam.',
    14: 'Lakuning Rembulan: Pembawa terang, berhati lembut, bijaksana, banyak memberi manfaat.',
    15: 'Lakuning Srengenge: Memiliki wibawa tinggi, tegas, berjiwa pemimpin, menjadi pelindung.',
    16: 'Lakuning Bumi: Pengayom, sabar, murah hati, tahan uji, serta berbudi luhur.',
    17: 'Lakuning Gunung: Pendiam, kokoh dalam berprinsip, memiliki cita-cita tinggi dan tekad baja.',
    18: 'Lakuning Paripurna: Karisma luar biasa, berwibawa tinggi, berpengaruh, namun perlu menjaga kerendahan hati.'
  };

  /**
   * Menghitung Pasaran dari tanggal Gregorian
   * Menggunakan acuan epoch standar:
   * 1 Januari 1970 = Kamis Wage (Hari 4, Pasaran Wage)
   */
  function getPasaran(dateInput) {
    const date = new Date(dateInput);
    // Hitung selisih hari UTC
    const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const epochUtc = Date.UTC(1970, 0, 1); // 1 Jan 1970 = Kamis Wage (Wage = index 3)
    const diffDays = Math.floor((utcDate - epochUtc) / 86400000);

    // Wage adalah index 3 di PASARAN
    const pasaranIndex = ((diffDays % 5) + 5 + 3) % 5;
    const dayOfWeek = date.getDay(); // 0 = Ahad, 1 = Senin, ...

    const hariObj = HARI[dayOfWeek];
    const pasaranObj = PASARAN[pasaranIndex];

    const totalNeptu = hariObj.neptu + pasaranObj.neptu;
    const watak = WATAK_NEPTU[totalNeptu] || 'Hari baik dan berkah untuk beramal shaleh serta berikhtiar.';

    return {
      hari: hariObj.nama,
      neptuHari: hariObj.neptu,
      pasaran: pasaranObj.nama,
      neptuPasaran: pasaranObj.neptu,
      totalNeptu: totalNeptu,
      arah: pasaranObj.arah,
      weton: `${hariObj.nama} ${pasaranObj.nama}`,
      watak: watak
    };
  }

  return {
    PASARAN,
    HARI,
    WATAK_NEPTU,
    getPasaran
  };
})();

if (typeof window !== 'undefined') {
  window.PrimbonEngine = PrimbonEngine;
}
