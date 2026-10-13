/**
 * app.js
 * Controller Utama & Pengendali Interaksi UI:
 * - Rendering kalender bulanan (Masehi + Hijriah + Pasaran)
 * - Pemilihan tanggal bebas & navigasi bulan/tahun
 * - Render kartu detail tanggal, Ompo Uleng, dan Primbon Weton
 * - Realtime Live Clock & Live Status Ompo Uleng
 * - Manajemen Event Berulang (Modal, Form, Render List)
 * - Modal Tabel Referensi Lengkap (Gambar kalender-hijriah.jpg)
 * - Pengaturan Koreksi Offset & Maghrib
 * - Tema Dark/Light Mode
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi ikon Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Aplikasi
  const today = new Date();
  let currentViewYear = today.getFullYear();
  let currentViewMonth = today.getMonth() + 1; // 1 - 12
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Elemen DOM Utama
  const calendarGrid = document.getElementById('calendarGrid');
  const selectMonth = document.getElementById('selectMonth');
  const selectYear = document.getElementById('selectYear');
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const btnToday = document.getElementById('btnToday');
  const currentHijriMonthHeader = document.getElementById('currentHijriMonthHeader');
  const headerOffsetNote = document.getElementById('headerOffsetNote');

  // Realtime Header Elements
  const realtimeLiveClock = document.getElementById('realtimeLiveClock');
  const todayGregorianFull = document.getElementById('todayGregorianFull');
  const todayHijriFull = document.getElementById('todayHijriFull');
  const todayWeton = document.getElementById('todayWeton');
  const liveStatusBadge = document.getElementById('liveStatusBadge');
  const liveStatusTimeRange = document.getElementById('liveStatusTimeRange');
  const liveDotIndicator = document.getElementById('liveDotIndicator');

  // Detail Tanggal Terpilih Elements
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedHijriTitle = document.getElementById('selectedHijriTitle');
  const selectedWetonBadge = document.getElementById('selectedWetonBadge');
  const selectedWetonWatak = document.getElementById('selectedWetonWatak');
  const selectedBarisInfo = document.getElementById('selectedBarisInfo');
  const ompoDailyTable = document.getElementById('ompoDailyTable');
  const ompoExpTitle = document.getElementById('ompoExpTitle');
  const ompoExpDesc = document.getElementById('ompoExpDesc');
  const countDayEvents = document.getElementById('countDayEvents');
  const dayEventsList = document.getElementById('dayEventsList');
  const btnQuickAddPlan = document.getElementById('btnQuickAddPlan');

  // Prayer UI Elements
  const selectPrayerCity = document.getElementById('selectPrayerCity');
  const prayerSourceBadge = document.getElementById('prayerSourceBadge');
  const prayerCityLabel = document.getElementById('prayerCityLabel');
  const timeImsak = document.getElementById('timeImsak');
  const timeSubuh = document.getElementById('timeSubuh');
  const timeTerbit = document.getElementById('timeTerbit');
  const timeDhuha = document.getElementById('timeDhuha');
  const timeDzuhur = document.getElementById('timeDzuhur');
  const timeAshar = document.getElementById('timeAshar');
  const timeMaghrib = document.getElementById('timeMaghrib');
  const timeIsya = document.getElementById('timeIsya');

  // Modals
  const modalEvent = document.getElementById('modalEvent');
  const btnOpenAddEvent = document.getElementById('btnOpenAddEvent');
  const btnCloseModalEvent = document.getElementById('btnCloseModalEvent');
  const btnCancelModalEvent = document.getElementById('btnCancelModalEvent');
  const formEvent = document.getElementById('formEvent');
  const eventRepeatType = document.getElementById('eventRepeatType');
  const repeatExtraOptions = document.getElementById('repeatExtraOptions');

  const modalReferenceTable = document.getElementById('modalReferenceTable');
  const btnOpenReferenceTable = document.getElementById('btnOpenReferenceTable');
  const btnCloseModalRef = document.getElementById('btnCloseModalRef');

  const modalSettings = document.getElementById('modalSettings');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseModalSettings = document.getElementById('btnCloseModalSettings');
  const formSettings = document.getElementById('formSettings');
  const inputOffset = document.getElementById('inputOffset');
  const btnOffsetMinus = document.getElementById('btnOffsetMinus');
  const btnOffsetPlus = document.getElementById('btnOffsetPlus');
  const offsetLabelText = document.getElementById('offsetLabelText');
  const checkSwitchMaghrib = document.getElementById('checkSwitchMaghrib');
  const selectMaghribHour = document.getElementById('selectMaghribHour');

  // Theme Toggle
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');

  // Inisialisasi Tema
  function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    }
  }

  btnThemeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIconSun.classList.toggle('hidden', !isDark);
    themeIconMoon.classList.toggle('hidden', isDark);
  });

  initTheme();

  // Inisialisasi Dropdown Bulan & Tahun
  function populateMonthYearSelects() {
    selectMonth.innerHTML = '';
    HijriEngine.GREGORIAN_MONTHS.forEach((mName, idx) => {
      const opt = document.createElement('option');
      opt.value = idx + 1;
      opt.textContent = mName;
      if (idx + 1 === currentViewMonth) opt.selected = true;
      selectMonth.appendChild(opt);
    });

    selectYear.innerHTML = '';
    for (let y = 1950; y <= 2100; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentViewYear) opt.selected = true;
      selectYear.appendChild(opt);
    }
  }

  populateMonthYearSelects();

  selectMonth.addEventListener('change', () => {
    currentViewMonth = parseInt(selectMonth.value, 10);
    renderCalendar();
  });

  selectYear.addEventListener('change', () => {
    currentViewYear = parseInt(selectYear.value, 10);
    renderCalendar();
  });

  btnPrevMonth.addEventListener('click', () => {
    currentViewMonth--;
    if (currentViewMonth < 1) {
      currentViewMonth = 12;
      currentViewYear--;
    }
    updateSelectsAndRender();
  });

  btnNextMonth.addEventListener('click', () => {
    currentViewMonth++;
    if (currentViewMonth > 12) {
      currentViewMonth = 1;
      currentViewYear++;
    }
    updateSelectsAndRender();
  });

  btnToday.addEventListener('click', () => {
    const now = new Date();
    currentViewYear = now.getFullYear();
    currentViewMonth = now.getMonth() + 1;
    selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    updateSelectsAndRender();
    updateSelectedDateView(selectedDate);
  });

  function updateSelectsAndRender() {
    selectMonth.value = currentViewMonth;
    selectYear.value = currentViewYear;
    renderCalendar();
  }

  // Update Header Offset Note
  function refreshSettingsUI() {
    const s = HijriEngine.getSettings();
    inputOffset.value = s.offset;
    checkSwitchMaghrib.checked = s.switchAtMaghrib;
    selectMaghribHour.value = s.maghribHour;
    
    if (s.offset === 0) {
      offsetLabelText.textContent = 'Hari (Standar)';
      headerOffsetNote.textContent = 'Offset: 0 Hari';
    } else {
      const sign = s.offset > 0 ? `+${s.offset}` : `${s.offset}`;
      offsetLabelText.textContent = `${sign} Hari`;
      headerOffsetNote.textContent = `Offset Hisab: ${sign} Hari`;
    }
  }

  refreshSettingsUI();

  // Realtime Live Clock & Live Ompo Uleng
  function updateRealtimeClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    realtimeLiveClock.textContent = `${hh}:${mm}:${ss}`;

    // Update Banner Info Hari Ini
    const hInfo = HijriEngine.fromGregorian(now, null, true);
    const primbon = PrimbonEngine.getPasaran(now);
    
    todayGregorianFull.textContent = `${hInfo.dayName}, ${now.getDate()} ${HijriEngine.GREGORIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    todayHijriFull.textContent = `${hInfo.hijriDay} ${hInfo.hijriMonthName} ${hInfo.hijriYear} H`;
    todayWeton.textContent = `${primbon.weton} (Neptu ${primbon.totalNeptu})`;

    // Live Ompo Uleng Status
    const ompoNow = OmpoUlengEngine.getCurrentStatus(hInfo.hijriDay, now.getHours());
    if (ompoNow.activeStatus) {
      const st = ompoNow.activeStatus;
      liveStatusBadge.className = `px-2.5 py-1 rounded text-xs font-bold badge-status badge-${st.key} flex items-center gap-1.5`;
      liveStatusBadge.innerHTML = `<span class="text-sm font-bold font-arabic">${st.huruf}</span><span>${st.nama}</span>`;
      liveStatusTimeRange.textContent = `(${ompoNow.activeSlot.jamLabel})`;
      liveDotIndicator.style.backgroundColor = st.warnaBg;
    } else {
      liveStatusBadge.className = 'px-2.5 py-1 rounded text-xs font-bold bg-slate-700 text-slate-200 flex items-center gap-1.5';
      liveStatusBadge.innerHTML = '<span>Malam Hari (18-06)</span>';
      liveStatusTimeRange.textContent = 'Waktu Istirahat & Ibadah';
      liveDotIndicator.style.backgroundColor = '#94a3b8';
    }
  }

  setInterval(updateRealtimeClock, 1000);
  updateRealtimeClock();

  // Render Kalender Bulanan
  function renderCalendar() {
    calendarGrid.innerHTML = '';

    const firstDayIndex = new Date(currentViewYear, currentViewMonth - 1, 1).getDay(); // 0 = Ahad
    const daysInCurrentMonth = HijriEngine.getDaysInGregorianMonth(currentViewYear, currentViewMonth);
    const daysInPrevMonth = HijriEngine.getDaysInGregorianMonth(
      currentViewMonth === 1 ? currentViewYear - 1 : currentViewYear,
      currentViewMonth === 1 ? 12 : currentViewMonth - 1
    );

    // Hitung estimasi bulan Hijriah di bulan ini untuk header
    const midMonthHijri = HijriEngine.fromGregorian(new Date(currentViewYear, currentViewMonth - 1, 15), null, false);
    currentHijriMonthHeader.textContent = `${midMonthHijri.hijriMonthName} ${midMonthHijri.hijriYear} H`;

    // 1. Hari-hari dari bulan sebelumnya (padding)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      const prevDate = new Date(
        currentViewMonth === 1 ? currentViewYear - 1 : currentViewYear,
        currentViewMonth === 1 ? 11 : currentViewMonth - 2,
        pDay
      );
      const cell = createCalendarCell(prevDate, true);
      calendarGrid.appendChild(cell);
    }

    // 2. Hari-hari bulan berjalan
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(currentViewYear, currentViewMonth - 1, d);
      const cell = createCalendarCell(curDate, false);
      calendarGrid.appendChild(cell);
    }

    // 3. Hari-hari bulan berikutnya (padding sisa 35 atau 42 kotak)
    const totalRendered = firstDayIndex + daysInCurrentMonth;
    const remaining = (Math.ceil(totalRendered / 7) * 7) - totalRendered;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(
        currentViewMonth === 12 ? currentViewYear + 1 : currentViewYear,
        currentViewMonth === 12 ? 0 : currentViewMonth,
        n
      );
      const cell = createCalendarCell(nextDate, true);
      calendarGrid.appendChild(cell);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Membuat satu elemen sel kalender
  function createCalendarCell(dateObj, isOtherMonth) {
    const gDay = dateObj.getDate();
    const gMonth = dateObj.getMonth() + 1;
    const gYear = dateObj.getFullYear();
    const dayOfWeek = dateObj.getDay();

    const hInfo = HijriEngine.fromGregorian(dateObj, null, false);
    const primbon = PrimbonEngine.getPasaran(dateObj);
    const holiday = HolidaysData.getHoliday(hInfo.hijriMonth, hInfo.hijriDay, gMonth, gDay);

    // Cek event aktif
    const eventContext = {
      gDate: dateObj,
      gYear,
      gMonth,
      gDay,
      hYear: hInfo.hijriYear,
      hMonth: hInfo.hijriMonth,
      hDay: hInfo.hijriDay,
      dayOfWeek,
      weton: primbon.weton,
      pasaran: primbon.pasaran
    };
    const activeEvents = EventsEngine.getEventsForDate(eventContext);

    // Ambil status Ompo Uleng Pagi untuk preview warna dot
    const ompoPagiStatus = OmpoUlengEngine.getDailySchedule(hInfo.hijriDay)[0].status;

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (isOtherMonth) cell.classList.add('is-other-month');

    // Tandai hari ini
    const isToday = (
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate()
    );
    if (isToday) cell.classList.add('is-today');

    // Tandai tanggal terpilih
    const isSelected = (
      dateObj.getFullYear() === selectedDate.getFullYear() &&
      dateObj.getMonth() === selectedDate.getMonth() &&
      dateObj.getDate() === selectedDate.getDate()
    );
    if (isSelected) cell.classList.add('is-selected');

    if (dayOfWeek === 5) cell.classList.add('is-friday'); // Jumat
    if (dayOfWeek === 0) cell.classList.add('is-sunday'); // Ahad

    // Header Sel: Tanggal Masehi & Tanggal Hijriah
    const topRow = document.createElement('div');
    topRow.className = 'flex items-start justify-between w-full';

    const gNum = document.createElement('span');
    gNum.className = `text-sm sm:text-base font-bold ${holiday || dayOfWeek === 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`;
    gNum.textContent = gDay;

    const hBadge = document.createElement('span');
    hBadge.className = 'text-[11px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 leading-tight';
    hBadge.textContent = hInfo.hijriDay;
    hBadge.title = `${hInfo.hijriDay} ${hInfo.hijriMonthName}`;

    topRow.appendChild(gNum);
    topRow.appendChild(hBadge);

    // Tengah Sel: Pasaran Weton Jawa & Status Dot Ompo Uleng
    const midRow = document.createElement('div');
    midRow.className = 'flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 w-full mt-1';

    const pasaranText = document.createElement('span');
    pasaranText.className = 'truncate font-medium';
    pasaranText.textContent = primbon.pasaran;

    // Mini indicator bar status Ompo Uleng (huruf hijaiyah kecil)
    const ompoMini = document.createElement('span');
    ompoMini.className = `w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white`;
    ompoMini.style.backgroundColor = ompoPagiStatus.warnaBg;
    if (ompoPagiStatus.key === 'berisi') ompoMini.style.color = '#1f2937';
    ompoMini.textContent = ompoPagiStatus.huruf;
    ompoMini.title = `Ompo Pagi: ${ompoPagiStatus.nama} (${ompoPagiStatus.huruf})`;

    midRow.appendChild(pasaranText);
    midRow.appendChild(ompoMini);

    // Bawah Sel: Event badge / Hari Libur
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center gap-1 w-full overflow-hidden mt-1';

    if (holiday) {
      const holDot = document.createElement('span');
      holDot.className = 'w-2 h-2 rounded-full bg-red-500 flex-shrink-0';
      holDot.title = holiday.name;
      bottomRow.appendChild(holDot);
    }

    if (activeEvents.length > 0) {
      const evtBadge = document.createElement('span');
      evtBadge.className = 'text-[9px] px-1 py-0.2 rounded font-semibold text-white truncate max-w-full';
      evtBadge.style.backgroundColor = activeEvents[0].color || '#10b981';
      evtBadge.textContent = activeEvents.length === 1 ? activeEvents[0].title : `${activeEvents.length} Rencana`;
      bottomRow.appendChild(evtBadge);
    }

    cell.appendChild(topRow);
    cell.appendChild(midRow);
    cell.appendChild(bottomRow);

    // Event Klik Sel: Update Detail Hari Terpilih
    cell.addEventListener('click', () => {
      selectedDate = dateObj;
      document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('is-selected'));
      cell.classList.add('is-selected');
      updateSelectedDateView(selectedDate);
    });

    return cell;
  }

  // Update Tampilan Panel Kanan untuk Hari Terpilih
  function updateSelectedDateView(dateObj) {
    const gDay = dateObj.getDate();
    const gMonth = dateObj.getMonth() + 1;
    const gYear = dateObj.getFullYear();
    const dayOfWeek = dateObj.getDay();

    const hInfo = HijriEngine.fromGregorian(dateObj, null, false);
    const primbon = PrimbonEngine.getPasaran(dateObj);
    const holiday = HolidaysData.getHoliday(hInfo.hijriMonth, hInfo.hijriDay, gMonth, gDay);

    selectedDateTitle.textContent = `${hInfo.dayName}, ${gDay} ${HijriEngine.GREGORIAN_MONTHS[dateObj.getMonth()]} ${gYear}`;
    selectedHijriTitle.textContent = `${hInfo.hijriDay} ${hInfo.hijriMonthName} ${hInfo.hijriYear} H (${hInfo.hijriMonthArabic})`;

    if (holiday) {
      selectedDateTitle.innerHTML += `<span class="block text-xs font-semibold text-red-500 mt-0.5">${holiday.name}</span>`;
    }

    // Weton
    selectedWetonBadge.textContent = `${primbon.weton} (Neptu ${primbon.totalNeptu})`;
    selectedWetonWatak.textContent = primbon.watak;

    // Ompo Uleng Detail
    const rowIndex = OmpoUlengEngine.getRowIndex(hInfo.hijriDay) + 1;
    selectedBarisInfo.textContent = `Baris ${rowIndex} (Tgl ${hInfo.hijriDay})`;

    const schedule = OmpoUlengEngine.getDailySchedule(hInfo.hijriDay);
    ompoDailyTable.innerHTML = '';

    schedule.forEach((item, idx) => {
      const box = document.createElement('div');
      box.className = `p-2 rounded-xl text-center cursor-pointer transition transform hover:scale-105 border border-transparent shadow-sm flex flex-col justify-between`;
      box.style.backgroundColor = item.status.warnaBg;
      box.style.color = item.status.warnaText;

      box.innerHTML = `
        <span class="text-[10px] font-bold opacity-90 block leading-tight">${item.jamLabel}</span>
        <span class="text-lg font-bold font-arabic my-0.5">${item.status.huruf}</span>
        <span class="text-[10px] font-semibold block leading-tight truncate">${item.status.nama}</span>
      `;

      box.addEventListener('click', () => {
        showOmpoExplanation(item);
      });

      ompoDailyTable.appendChild(box);
    });

    // Tampilkan default penjelasan slot pertama
    showOmpoExplanation(schedule[0]);

    // Render Events pada Tanggal ini
    const eventContext = {
      gDate: dateObj,
      gYear,
      gMonth,
      gDay,
      hYear: hInfo.hijriYear,
      hMonth: hInfo.hijriMonth,
      hDay: hInfo.hijriDay,
      dayOfWeek,
      weton: primbon.weton,
      pasaran: primbon.pasaran
    };
    renderDayEvents(eventContext);

    // Update Jadwal Sholat Kemenag/MUI
    updatePrayerScheduleForDate(dateObj);
  }

  // Pengelolaan Jadwal Sholat
  function populatePrayerCities() {
    selectPrayerCity.innerHTML = '';
    const currentCity = PrayerEngine.getCity();

    PrayerEngine.POPULAR_CITIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nama;
      if (c.id === currentCity.id) opt.selected = true;
      selectPrayerCity.appendChild(opt);
    });

    prayerCityLabel.textContent = `Lokasi: ${currentCity.nama}`;
  }

  selectPrayerCity.addEventListener('change', () => {
    const selectedId = selectPrayerCity.value;
    const found = PrayerEngine.POPULAR_CITIES.find(c => c.id === selectedId);
    if (found) {
      PrayerEngine.setCity(found);
      prayerCityLabel.textContent = `Lokasi: ${found.nama}`;
      updatePrayerScheduleForDate(selectedDate);
    }
  });

  async function updatePrayerScheduleForDate(dateObj) {
    // Tampilkan placeholder loading
    timeImsak.textContent = '...';
    timeSubuh.textContent = '...';
    timeTerbit.textContent = '...';
    timeDhuha.textContent = '...';
    timeDzuhur.textContent = '...';
    timeAshar.textContent = '...';
    timeMaghrib.textContent = '...';
    timeIsya.textContent = '...';

    const schedule = await PrayerEngine.getPrayerSchedule(dateObj);
    if (schedule) {
      timeImsak.textContent = schedule.imsak || '--:--';
      timeSubuh.textContent = schedule.subuh || '--:--';
      timeTerbit.textContent = schedule.terbit || '--:--';
      timeDhuha.textContent = schedule.dhuha || '--:--';
      timeDzuhur.textContent = schedule.dzuhur || '--:--';
      timeAshar.textContent = schedule.ashar || '--:--';
      timeMaghrib.textContent = schedule.maghrib || '--:--';
      timeIsya.textContent = schedule.isya || '--:--';

      if (schedule.source === 'api_kemenag') {
        prayerSourceBadge.textContent = 'Kemenag RI';
        prayerSourceBadge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold';
      } else {
        prayerSourceBadge.textContent = 'Hisab Offline';
        prayerSourceBadge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold';
      }
    }
  }

  populatePrayerCities();

  function showOmpoExplanation(scheduleItem) {
    ompoExpTitle.innerHTML = `
      <span class="w-3 h-3 rounded-full inline-block mr-1" style="background-color: ${scheduleItem.status.warnaBg}"></span>
      <span>${scheduleItem.jamLabel} (${scheduleItem.namaWaktu}) : <strong>${scheduleItem.status.nama} (${scheduleItem.status.huruf})</strong></span>
    `;
    ompoExpDesc.innerHTML = `
      <p class="mb-1">${scheduleItem.status.makna}</p>
      <p class="text-emerald-700 dark:text-emerald-300 font-medium"><strong>Anjuran:</strong> ${scheduleItem.status.anjuran}</p>
    `;
  }

  // Render Daftar Rencana Hari Terpilih
  function renderDayEvents(context) {
    const list = EventsEngine.getEventsForDate(context);
    countDayEvents.textContent = list.length;
    dayEventsList.innerHTML = '';

    if (list.length === 0) {
      dayEventsList.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs">
          <i data-lucide="calendar-x" class="w-8 h-8 mx-auto mb-1 opacity-50"></i>
          Belum ada rencana khusus untuk hari ini.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    list.forEach(evt => {
      const item = document.createElement('div');
      item.className = 'p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-start justify-between gap-2 text-xs';
      
      const left = document.createElement('div');
      left.className = 'flex-1';
      left.innerHTML = `
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${evt.color || '#10b981'}"></span>
          <span class="font-bold text-slate-900 dark:text-white">${evt.title}</span>
          <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">${formatRepeatType(evt.repeatType)}</span>
        </div>
        ${evt.notes ? `<p class="text-slate-500 mt-1 text-[11px] leading-relaxed">${evt.notes}</p>` : ''}
      `;

      const right = document.createElement('div');
      right.className = 'flex items-center space-x-1';
      
      const btnDel = document.createElement('button');
      btnDel.className = 'p-1 text-slate-400 hover:text-red-500 transition rounded';
      btnDel.title = 'Hapus Rencana';
      btnDel.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Hapus rencana "${evt.title}"?`)) {
          EventsEngine.deleteEvent(evt.id);
          renderCalendar();
          updateSelectedDateView(selectedDate);
        }
      });

      right.appendChild(btnDel);
      item.appendChild(left);
      item.appendChild(right);

      dayEventsList.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function formatRepeatType(type) {
    switch (type) {
      case 'none': return 'Sekali Saja';
      case 'daily': return 'Setiap Hari';
      case 'weekly': return 'Mingguan';
      case 'weekly_senin_kamis': return 'Senin & Kamis';
      case 'monthly_hijri': return 'Bulanan Hijriah';
      case 'hijri_ayyamul_bidh': return 'Ayyamul Bidh (13,14,15)';
      case 'monthly_gregorian': return 'Bulanan Masehi';
      case 'yearly_hijri': return 'Tahunan Hijriah';
      case 'yearly_gregorian': return 'Tahunan Masehi';
      case 'pasaran': return 'Weton Pasaran';
      default: return 'Rutin';
    }
  }

  // Handle Form Repeat Type Changes
  eventRepeatType.addEventListener('change', () => {
    const val = eventRepeatType.value;
    repeatExtraOptions.innerHTML = '';
    repeatExtraOptions.classList.add('hidden');

    if (val === 'weekly') {
      repeatExtraOptions.classList.remove('hidden');
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Pilih Hari dalam Sepekan:</label>
        <div class="grid grid-cols-4 sm:grid-cols-7 gap-1">
          ${HijriEngine.DAYS_ID.map((dName, idx) => `
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="weeklyDays" value="${idx}" class="rounded text-emerald-600">
              <span>${dName}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (val === 'monthly_hijri') {
      repeatExtraOptions.classList.remove('hidden');
      const curHInfo = HijriEngine.fromGregorian(selectedDate, null, false);
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Setiap Tanggal Hijriah:</label>
        <div class="flex items-center gap-2">
          <input type="number" id="inputRepeatHijriDay" min="1" max="30" value="${curHInfo.hijriDay}" class="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold">
          <span class="text-slate-500">Hijriah (1 - 30)</span>
        </div>
      `;
    } else if (val === 'monthly_gregorian') {
      repeatExtraOptions.classList.remove('hidden');
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Setiap Tanggal Masehi:</label>
        <div class="flex items-center gap-2">
          <input type="number" id="inputRepeatGregorianDay" min="1" max="31" value="${selectedDate.getDate()}" class="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold">
          <span class="text-slate-500">Masehi (1 - 31)</span>
        </div>
      `;
    } else if (val === 'yearly_hijri') {
      repeatExtraOptions.classList.remove('hidden');
      const curHInfo = HijriEngine.fromGregorian(selectedDate, null, false);
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Setiap Tahun pada Tanggal & Bulan Hijriah:</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-500 mb-0.5">Tanggal Hijriah:</label>
            <input type="number" id="inputRepeatYearlyHDay" min="1" max="30" value="${curHInfo.hijriDay}" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold">
          </div>
          <div>
            <label class="block text-slate-500 mb-0.5">Bulan Hijriah:</label>
            <select id="selectRepeatYearlyHMonth" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs">
              ${HijriEngine.HIJRI_MONTHS.map(m => `
                <option value="${m.id}" ${m.id === curHInfo.hijriMonth ? 'selected' : ''}>${m.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    } else if (val === 'yearly_gregorian') {
      repeatExtraOptions.classList.remove('hidden');
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Setiap Tahun pada Tanggal & Bulan Masehi:</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-500 mb-0.5">Tanggal:</label>
            <input type="number" id="inputRepeatYearlyGDay" min="1" max="31" value="${selectedDate.getDate()}" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold">
          </div>
          <div>
            <label class="block text-slate-500 mb-0.5">Bulan:</label>
            <select id="selectRepeatYearlyGMonth" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs">
              ${HijriEngine.GREGORIAN_MONTHS.map((mName, idx) => `
                <option value="${idx + 1}" ${idx === selectedDate.getMonth() ? 'selected' : ''}>${mName}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    } else if (val === 'pasaran') {
      repeatExtraOptions.classList.remove('hidden');
      const curPrimbon = PrimbonEngine.getPasaran(selectedDate);
      repeatExtraOptions.innerHTML = `
        <label class="block font-semibold mb-1">Pilih Pasaran Jawa:</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-500 mb-0.5">Pasaran Tunggal:</label>
            <select id="selectRepeatPasaran" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
              ${PrimbonEngine.PASARAN.map(p => `
                <option value="${p.nama}" ${p.nama === curPrimbon.pasaran ? 'selected' : ''}>${p.nama}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-slate-500 mb-0.5">Weton Spesifik:</label>
            <input type="text" id="inputRepeatWeton" placeholder="Misal: Jumat Kliwon" value="${curPrimbon.weton}" class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
          </div>
        </div>
      `;
    }
  });

  // Buka Modal Tambah Rencana
  function openAddEventModal() {
    formEvent.reset();
    document.getElementById('eventId').value = '';
    document.getElementById('modalEventTitle').textContent = 'Tambah Rencana Baru';
    eventRepeatType.value = 'none';
    repeatExtraOptions.classList.add('hidden');
    repeatExtraOptions.innerHTML = '';
    modalEvent.classList.remove('hidden');
  }

  btnOpenAddEvent.addEventListener('click', openAddEventModal);
  btnQuickAddPlan.addEventListener('click', openAddEventModal);

  btnCloseModalEvent.addEventListener('click', () => modalEvent.classList.add('hidden'));
  btnCancelModalEvent.addEventListener('click', () => modalEvent.classList.add('hidden'));

  // Submit Form Event
  formEvent.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('eventTitleInput').value.trim();
    if (!title) return;

    const category = document.getElementById('eventCategory').value;
    const color = document.getElementById('eventColor').value;
    const repeat = eventRepeatType.value;
    const notes = document.getElementById('eventNotes').value.trim();

    const newEvtData = {
      title,
      category,
      color,
      repeatType: repeat,
      notes,
      targetDate: selectedDate.toISOString()
    };

    if (repeat === 'weekly') {
      const checkedDays = Array.from(document.querySelectorAll('input[name="weeklyDays"]:checked')).map(cb => parseInt(cb.value, 10));
      newEvtData.daysOfWeek = checkedDays.length > 0 ? checkedDays : [selectedDate.getDay()];
    } else if (repeat === 'monthly_hijri') {
      const hDayVal = document.getElementById('inputRepeatHijriDay');
      newEvtData.hijriDay = hDayVal ? parseInt(hDayVal.value, 10) : 1;
    } else if (repeat === 'monthly_gregorian') {
      const gDayVal = document.getElementById('inputRepeatGregorianDay');
      newEvtData.monthlyDay = gDayVal ? parseInt(gDayVal.value, 10) : 1;
    } else if (repeat === 'yearly_hijri') {
      const yhDayVal = document.getElementById('inputRepeatYearlyHDay');
      const yhMonthVal = document.getElementById('selectRepeatYearlyHMonth');
      newEvtData.hijriDay = yhDayVal ? parseInt(yhDayVal.value, 10) : 1;
      newEvtData.hijriMonth = yhMonthVal ? parseInt(yhMonthVal.value, 10) : 1;
    } else if (repeat === 'yearly_gregorian') {
      const ygDayVal = document.getElementById('inputRepeatYearlyGDay');
      const ygMonthVal = document.getElementById('selectRepeatYearlyGMonth');
      newEvtData.gregorianDay = ygDayVal ? parseInt(ygDayVal.value, 10) : 1;
      newEvtData.gregorianMonth = ygMonthVal ? parseInt(ygMonthVal.value, 10) : 1;
    } else if (repeat === 'pasaran') {
      const pasVal = document.getElementById('selectRepeatPasaran');
      const wetVal = document.getElementById('inputRepeatWeton');
      if (wetVal && wetVal.value.trim()) {
        newEvtData.targetWeton = wetVal.value.trim();
      } else if (pasVal) {
        newEvtData.targetPasaran = pasVal.value;
      }
    }

    EventsEngine.addEvent(newEvtData);
    modalEvent.classList.add('hidden');
    renderCalendar();
    updateSelectedDateView(selectedDate);
  });

  // Modal Referensi Ompo Uleng
  btnOpenReferenceTable.addEventListener('click', () => modalReferenceTable.classList.remove('hidden'));
  btnCloseModalRef.addEventListener('click', () => modalReferenceTable.classList.add('hidden'));

  // Modal Pengaturan & Offset
  btnOpenSettings.addEventListener('click', () => {
    refreshSettingsUI();
    modalSettings.classList.remove('hidden');
  });
  btnCloseModalSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));

  btnOffsetMinus.addEventListener('click', () => {
    let val = parseInt(inputOffset.value, 10) || 0;
    if (val > -3) val--;
    inputOffset.value = val;
  });

  btnOffsetPlus.addEventListener('click', () => {
    let val = parseInt(inputOffset.value, 10) || 0;
    if (val < 3) val++;
    inputOffset.value = val;
  });

  formSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    const off = parseInt(inputOffset.value, 10) || 0;
    const maghrib = checkSwitchMaghrib.checked;
    const maghribH = parseInt(selectMaghribHour.value, 10) || 18;

    HijriEngine.saveSettings({
      offset: off,
      switchAtMaghrib: maghrib,
      maghribHour: maghribH
    });

    modalSettings.classList.add('hidden');
    refreshSettingsUI();
    updateRealtimeClock();
    renderCalendar();
    updateSelectedDateView(selectedDate);
  });

  // Initial Render
  renderCalendar();
  updateSelectedDateView(selectedDate);
});
