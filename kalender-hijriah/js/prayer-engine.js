/**
 * prayer-engine.js
 * Modul Jadwal Sholat Kemenag RI / Bimas Islam (API myQuran)
 * dilengkapi mesin kalkulasi cadangan astronomis offline (MUI/Kemenag standar)
 * sehingga jadwal sholat tetap tersedia walau sedang offline.
 */

const PrayerEngine = (() => {
  const STORAGE_KEY = 'kalender_hijriah_prayer_city';
  
  // Default: Kota Jakarta (ID: 1301)
  let currentCity = {
    id: '1301',
    nama: 'KOTA JAKARTA',
    daerah: 'DKI JAKARTA',
    lat: -6.2088,
    lng: 106.8456,
    timezone: 7
  };

  // Daftar kota populer default untuk dropdown cepat
  const POPULAR_CITIES = [
    { id: '1301', nama: 'Jakarta', lat: -6.2088, lng: 106.8456, timezone: 7 },
    { id: '1203', nama: 'Bandung', lat: -6.9175, lng: 107.6191, timezone: 7 },
    { id: '1638', nama: 'Surabaya', lat: -7.2575, lng: 112.7521, timezone: 7 },
    { id: '1405', nama: 'Semarang', lat: -6.9667, lng: 110.4167, timezone: 7 },
    { id: '1505', nama: 'Yogyakarta', lat: -7.7956, lng: 110.3695, timezone: 7 },
    { id: '0228', nama: 'Medan', lat: 3.5952, lng: 98.6722, timezone: 7 },
    { id: '2308', nama: 'Makassar', lat: -5.1477, lng: 119.4327, timezone: 8 },
    { id: '2408', nama: 'Balikpapan', lat: -1.2379, lng: 116.8529, timezone: 8 },
    { id: '2105', nama: 'Denpasar', lat: -8.6705, lng: 115.2126, timezone: 8 },
    { id: '2705', nama: 'Jayapura', lat: -2.5916, lng: 140.6690, timezone: 9 }
  ];

  // In-memory cache jadwal untuk hari-hari yang sudah di-fetch
  const scheduleCache = new Map();

  function initCity() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          currentCity = JSON.parse(saved);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat preferensi kota:', e);
    }
  }

  initCity();

  function setCity(cityObj) {
    currentCity = { ...currentCity, ...cityObj };
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCity));
    }
  }

  function getCity() {
    return { ...currentCity };
  }

  /**
   * Perhitungan Waktu Sholat Cadangan (Algoritma Astronomis Standar Kemenag/MUI)
   * Subuh: Sudut depresi matahari -20 derajat
   * Isya: Sudut depresi matahari -18 derajat
   * Ashar: Bayangan = tinggi benda + bayangan saat dzuhur (Syafi'i)
   */
  function calculateOfflinePrayerTimes(date, lat = currentCity.lat, lng = currentCity.lng, timezone = currentCity.timezone) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Hari dalam tahun
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

    // Deklinasi matahari & Equation of Time (Perataan Waktu)
    const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
    const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // dalam menit
    const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365); // dalam derajat

    const degToRad = (deg) => (deg * Math.PI) / 180;
    const radToDeg = (rad) => (rad * 180) / Math.PI;

    const latRad = degToRad(lat);
    const decRad = degToRad(declination);

    // Dzuhur waktu lokal
    // Waktu transit matahari = 12:00 + timezone*60 - (lng * 4) - EoT
    const noonMinutes = 12 * 60 + timezone * 60 - lng * 4 - EoT + 2; // +2 menit ikhtiyat
    const dzuhurH = Math.floor(noonMinutes / 60);
    const dzuhurM = Math.floor(noonMinutes % 60);

    // Sudut jam untuk ketinggian matahari tertentu
    function getHourAngle(altitudeDeg) {
      const altRad = degToRad(altitudeDeg);
      const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
                   (Math.cos(latRad) * Math.cos(decRad));
      if (cosH < -1 || cosH > 1) return 0;
      return radToDeg(Math.acos(cosH));
    }

    // Subuh (-20 derajat Kemenag)
    const subuhHA = getHourAngle(-20);
    const subuhMinutes = noonMinutes - (subuhHA * 4) + 2; // +2 menit ikhtiyat
    // Imsak: 10 menit sebelum subuh
    const imsakMinutes = subuhMinutes - 10;

    // Terbit (Sunrise, -0.833 derajat)
    const sunriseHA = getHourAngle(-0.833);
    const sunriseMinutes = noonMinutes - (sunriseHA * 4);
    // Dhuha (+4.5 derajat)
    const dhuhaHA = getHourAngle(4.5);
    const dhuhaMinutes = noonMinutes - (dhuhaHA * 4);

    // Ashar (Bayangan + 1)
    const asharAltRad = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decRad))));
    const asharHA = getHourAngle(radToDeg(asharAltRad));
    const asharMinutes = noonMinutes + (asharHA * 4) + 2;

    // Maghrib (-0.833 derajat + refraksi atmosfer)
    const maghribHA = getHourAngle(-1);
    const maghribMinutes = noonMinutes + (maghribHA * 4) + 2;

    // Isya (-18 derajat Kemenag)
    const isyaHA = getHourAngle(-18);
    const isyaMinutes = noonMinutes + (isyaHA * 4) + 2;

    function formatTime(totalMins) {
      let m = Math.round(totalMins);
      let h = Math.floor(m / 60) % 24;
      let min = m % 60;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    return {
      source: 'offline_kemenag_formula',
      imsak: formatTime(imsakMinutes),
      subuh: formatTime(subuhMinutes),
      terbit: formatTime(sunriseMinutes),
      dhuha: formatTime(dhuhaMinutes),
      dzuhur: formatTime(dzuhurH * 60 + dzuhurM),
      ashar: formatTime(asharMinutes),
      maghrib: formatTime(maghribMinutes),
      isya: formatTime(isyaMinutes)
    };
  }

  /**
   * Mengambil jadwal sholat untuk tanggal tertentu via API myQuran (Bimas Islam Kemenag RI)
   * dengan fallback otomatis ke rumus offline jika jaringan lambat / offline.
   */
  async function getPrayerSchedule(date, cityId = currentCity.id) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const cacheKey = `${cityId}_${y}_${m}_${d}`;

    if (scheduleCache.has(cacheKey)) {
      return scheduleCache.get(cacheKey);
    }

    try {
      const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${y}/${m}/${d}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.status && json.data && json.data.jadwal) {
          const apiJadwal = json.data.jadwal;
          const result = {
            source: 'api_kemenag',
            imsak: apiJadwal.imsak,
            subuh: apiJadwal.subuh,
            terbit: apiJadwal.terbit,
            dhuha: apiJadwal.dhuha,
            dzuhur: apiJadwal.dzuhur,
            ashar: apiJadwal.ashar,
            maghrib: apiJadwal.maghrib,
            isya: apiJadwal.isya,
            lokasi: json.data.lokasi
          };
          scheduleCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat API sholat, beralih ke rumus offline:', e);
    }

    // Jika gagal atau offline, gunakan rumus kalkulasi astronomis standar Kemenag RI
    const offlineRes = calculateOfflinePrayerTimes(date);
    offlineRes.lokasi = currentCity.nama;
    scheduleCache.set(cacheKey, offlineRes);
    return offlineRes;
  }

  let allCitiesCache = null;

  /**
   * Mengambil seluruh daftar kota/kabupaten resmi Kemenag
   */
  async function getAllCities() {
    if (allCitiesCache && allCitiesCache.length > 0) return allCitiesCache;
    try {
      const res = await fetch('https://api.myquran.com/v2/sholat/kota/semua');
      if (res.ok) {
        const json = await res.json();
        if (json.status && Array.isArray(json.data)) {
          allCitiesCache = json.data;
          return allCitiesCache;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat seluruh kota:', e);
    }
    return POPULAR_CITIES;
  }

  /**
   * Cari kota via API myQuran
   */
  async function searchCity(keyword) {
    if (!keyword || keyword.trim().length === 0) return POPULAR_CITIES;
    const cleanKw = keyword.trim().toLowerCase();
    try {
      const res = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cleanKw)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Error cari kota:', e);
    }

    // Fallback: pencarian lokal dari allCitiesCache atau POPULAR_CITIES
    const citiesToSearch = allCitiesCache || POPULAR_CITIES;
    return citiesToSearch.filter(c => (c.lokasi || c.nama || '').toLowerCase().includes(cleanKw));
  }

  /**
   * Deteksi Lokasi Otomatis via HTML5 Geolocation & Reverse Geocoding
   */
  function detectCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Browser tidak mendukung Geolocation'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Estimasi timezone Indonesia berdasarkan bujur (lng)
          let timezone = 7; // WIB
          if (lng > 115 && lng <= 125) timezone = 8; // WITA
          else if (lng > 125) timezone = 9; // WIT

          let detectedName = 'Lokasi GPS Otomatis';
          let matchedCity = null;

          try {
            // Reverse Geocoding via BigDataCloud client API (gratis, tanpa token)
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const kecamatan = geoData.locality || '';
              const kotaKab = geoData.city || geoData.principalSubdivision || '';
              detectedName = [kecamatan, kotaKab].filter(Boolean).join(', ') || 'Lokasi Terdeteksi';

              // Cari kode kota Kemenag terdekat berdasarkan nama kota / kecamatan
              const searchKeyword = kotaKab.replace(/^(kota|kabupaten|kab\.)\s+/i, '').trim();
              if (searchKeyword) {
                const candidates = await searchCity(searchKeyword);
                if (candidates && candidates.length > 0) {
                  matchedCity = candidates[0];
                }
              }
            }
          } catch (err) {
            console.warn('Gagal reverse geocoding, menggunakan koordinat GPS:', err);
          }

          const resolvedCity = {
            id: matchedCity ? matchedCity.id : 'custom_gps',
            nama: detectedName,
            daerah: matchedCity ? (matchedCity.daerah || matchedCity.lokasi) : 'Koordinat GPS',
            lat: lat,
            lng: lng,
            timezone: timezone,
            isGPS: true
          };

          setCity(resolvedCity);
          resolve(resolvedCity);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  return {
    POPULAR_CITIES,
    getCity,
    setCity,
    getPrayerSchedule,
    calculateOfflinePrayerTimes,
    searchCity,
    getAllCities,
    detectCurrentLocation
  };
})();

if (typeof window !== 'undefined') {
  window.PrayerEngine = PrayerEngine;
}
