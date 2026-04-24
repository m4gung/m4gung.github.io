// Admin Dashboard Logic
const ADMIN_PASSWORD = 'password';

document.addEventListener('DOMContentLoaded', () => {
    const adminSection = document.getElementById('admin-app');
    const statsContainer = document.getElementById('statsContainer');
    const adminBookingsList = document.getElementById('adminBookingsList');
    const adminDateSelect = document.getElementById('adminDateSelect');
    const availableSlotsContainer = document.getElementById('availableSlotsContainer');
    const refreshAdminBookingsBtn = document.getElementById('refreshAdminBookings');
    const checkSlotsBtn = document.getElementById('checkSlotsBtn');
    const adminYearSpan = document.getElementById('adminYear');

    let isAdminAuthenticated = false;
    let lastBookingTime = 0;
    let notificationEnabled = false;

    adminYearSpan.textContent = new Date().getFullYear();

    const today = new Date().toISOString().split('T')[0];
    adminDateSelect.min = today;
    adminDateSelect.value = today;

    const adminUserInfo = document.getElementById('adminUserInfo');

    function checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                notificationEnabled = true;
                return true;
            } else if (Notification.permission === 'denied') {
                return false;
            }
        }
        return null;
    }

    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                notificationEnabled = permission === 'granted';
                if (notificationEnabled) {
                    console.log('Notification permission granted');
                }
            }).catch(err => {
                console.log('Notification permission denied:', err);
            });
        }
    }

    function showNotification(title, body) {
        console.log('Attempting to show notification:', title, body);
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: body,
                    icon: 'icon-192.png',
                    badge: 'icon-192.png',
                    vibrate: [200, 100, 200]
                });
                console.log('Notification shown successfully');
            } catch (e) {
                console.error('Error showing notification:', e);
            }
        } else {
            console.log('Notification not available, permission:', Notification.permission);
        }
    }

    function showLoginForm() {
        adminUserInfo.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="password" id="adminPassword" placeholder="Password Admin" 
                    class="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none">
                <button id="adminLoginBtn" class="bg-accent hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Login
                </button>
            </div>
        `;
        document.getElementById('adminLoginBtn').addEventListener('click', checkAdminPassword);
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAdminPassword();
        });
    }

    function checkAdminPassword() {
        const passwordInput = document.getElementById('adminPassword').value;
        if (passwordInput === ADMIN_PASSWORD) {
            isAdminAuthenticated = true;
            initializeApp();
        } else {
            alert('Password salah!');
        }
    }

    function initializeApp() {
        adminUserInfo.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium">Admin</span>
                <button id="enableNotifBtn" class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg text-xs transition-colors" title="Aktifkan Notifikasi">
                    <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                </button>
                <button id="adminLogout" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors">
                    Logout
                </button>
            </div>
        `;
        
        const enableNotifBtn = document.getElementById('enableNotifBtn');
        const notifPerm = checkNotificationPermission();
        
        if (notifPerm === true) {
            enableNotifBtn.classList.add('hidden');
        } else if (notifPerm === false) {
            enableNotifBtn.title = 'Notifikasi diblokir - ubah di browser settings';
            enableNotifBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        }
        
        enableNotifBtn.addEventListener('click', () => {
            if (Notification.permission === 'default') {
                requestNotificationPermission();
            } else if (Notification.permission === 'denied') {
                alert('Notifikasi diblokir oleh browser. Silakan ubah di pengaturan browser: Settings > Notifications > Allow');
            }
        });

        document.getElementById('adminLogout').addEventListener('click', () => {
            isAdminAuthenticated = false;
            showLoginForm();
        });
        
        requestNotificationPermission();
        initializeData();
        loadAllBookings();
        loadStats();
        listenForNewBookings();
    }

    function listenForNewBookings() {
        db.collection('bookings')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                console.log('Listening for new bookings...');
                if (!snapshot.empty) {
                    const latestBooking = snapshot.docs[0].data();
                    const createdAt = latestBooking.createdAt ? latestBooking.createdAt.toMillis() : 0;
                    
                    console.log('Latest booking time:', createdAt, 'Last time:', lastBookingTime);
                    
                    if (lastBookingTime > 0 && createdAt > lastBookingTime) {
                        console.log('New booking detected!');
                        db.collection('settings').doc('services').get().then((servicesDoc) => {
                            let serviceName = latestBooking.service;
                            if (servicesDoc.exists) {
                                const services = servicesDoc.data().services;
                                const found = services.find(s => s.id === latestBooking.service);
                                if (found) serviceName = found.name;
                            }
                            
                            const message = `${latestBooking.customerName} - ${serviceName}\n${latestBooking.date} jam ${latestBooking.time}`;
                            
                            showNotification('Booking Baru!', message);
                            
                            alert(`🔔 Booking Baru!\n\n${message}`);
                        });
                    }
                    
                    lastBookingTime = createdAt;
                }
            });
    }

    showLoginForm();

    async function initializeData() {
        await checkAndGenerateServices();
        await checkAndGenerateTimeSlots();
        renderServicesManagement();
        renderTimeSlotsManagement();
    }

    async function checkAndGenerateServices() {
        const servicesSnapshot = await db.collection('settings').doc('services').get();
        if (!servicesSnapshot.exists) {
            const defaultServices = [
                { id: 'haircut', name: 'Potong Rambut', price: 30000, duration: 30 },
                { id: 'shave', name: 'Goyang', price: 25000, duration: 20 },
                { id: 'beard', name: 'Perawatan Jenggot', price: 20000, duration: 20 },
                { id: 'package', name: 'Paket Lengkap', price: 70000, duration: 60 }
            ];
            await db.collection('settings').doc('services').set({ services: defaultServices });
        }
    }

    async function checkAndGenerateTimeSlots() {
        const timeSlotsSnapshot = await db.collection('settings').doc('timeSlots').get();
        if (!timeSlotsSnapshot.exists) {
            const defaultTimeSlots = [];
            for (let hour = 9; hour < 18; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    defaultTimeSlots.push({
                        id: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                    });
                }
            }
            await db.collection('settings').doc('timeSlots').set({ slots: defaultTimeSlots });
        }
    }

    function renderServicesManagement() {
        db.collection('settings').doc('services').onSnapshot((doc) => {
            const servicesList = document.getElementById('servicesList');
            servicesList.innerHTML = '';
            if (doc.exists) {
                const services = doc.data().services;
                services.forEach(service => {
                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'bg-gray-50 rounded-xl p-4 flex items-center justify-between';
                    serviceCard.innerHTML = `
                        <div>
                            <h4 class="font-semibold text-gray-800">${service.name}</h4>
                            <p class="text-sm text-gray-500">Rp ${service.price.toLocaleString('id-ID')} - ${service.duration} menit</p>
                        </div>
                        <button class="delete-service text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors" data-id="${service.id}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    `;
                    serviceCard.querySelector('.delete-service').addEventListener('click', () => deleteService(service.id));
                    servicesList.appendChild(serviceCard);
                });
            }
        });

        document.getElementById('addServiceBtn').addEventListener('click', addNewService);
    }

    function renderTimeSlotsManagement() {
        db.collection('settings').doc('timeSlots').onSnapshot((doc) => {
            const timeSlotsList = document.getElementById('timeSlotsList');
            timeSlotsList.innerHTML = '';
            if (doc.exists) {
                const slots = doc.data().slots.sort((a, b) => a.time.localeCompare(b.time));
                slots.forEach(slot => {
                    const slotCard = document.createElement('div');
                    slotCard.className = 'bg-gray-50 rounded-xl p-3 flex items-center justify-between';
                    slotCard.innerHTML = `
                        <span class="font-medium text-gray-700">${slot.time}</span>
                        <button class="delete-time-slot text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors" data-id="${slot.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    `;
                    slotCard.querySelector('.delete-time-slot').addEventListener('click', () => deleteTimeSlot(slot.id));
                    timeSlotsList.appendChild(slotCard);
                });
            }
        });

        document.getElementById('addTimeSlotBtn').addEventListener('click', addNewTimeSlot);
    }

    async function addNewService() {
        const name = document.getElementById('newServiceName').value.trim();
        const price = parseInt(document.getElementById('newServicePrice').value);
        const duration = parseInt(document.getElementById('newServiceDuration').value);

        if (!name || !price || !duration) {
            alert('Harap isi semua field');
            return;
        }

        const id = name.toLowerCase().replace(/\s+/g, '-');
        const doc = await db.collection('settings').doc('services').get();
        const services = doc.data().services;
        services.push({ id, name, price, duration });
        await db.collection('settings').doc('services').update({ services });

        document.getElementById('newServiceName').value = '';
        document.getElementById('newServicePrice').value = '';
        document.getElementById('newServiceDuration').value = '';
    }

    async function deleteService(serviceId) {
        if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return;

        const doc = await db.collection('settings').doc('services').get();
        const services = doc.data().services.filter(s => s.id !== serviceId);
        await db.collection('settings').doc('services').update({ services });
    }

    async function addNewTimeSlot() {
        const time = document.getElementById('newTimeSlot').value;
        if (!time) {
            alert('Harap pilih waktu');
            return;
        }

        const doc = await db.collection('settings').doc('timeSlots').get();
        const slots = doc.data().slots;
        
        if (slots.some(s => s.time === time)) {
            alert('Waktu ini sudah ada');
            return;
        }

        slots.push({ id: time, time });
        await db.collection('settings').doc('timeSlots').update({ slots });

        document.getElementById('newTimeSlot').value = '';
    }

    async function deleteTimeSlot(slotId) {
        if (!confirm('Apakah Anda yakin ingin menghapus waktu ini?')) return;

        const doc = await db.collection('settings').doc('timeSlots').get();
        const slots = doc.data().slots.filter(s => s.id !== slotId);
        await db.collection('settings').doc('timeSlots').update({ slots });
    }

    function loadAllBookings() {
        db.collection('bookings')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                adminBookingsList.innerHTML = '';
                
                db.collection('settings').doc('services').get().then((servicesDoc) => {
                    const serviceNames = {};
                    if (servicesDoc.exists) {
                        servicesDoc.data().services.forEach(s => {
                            serviceNames[s.id] = s.name;
                        });
                    }

                    if (snapshot.empty) {
                        adminBookingsList.innerHTML = `
                            <div class="text-center py-8">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                    </svg>
                                </div>
                                <p class="text-gray-500">Belum ada booking</p>
                            </div>
                        `;
                        return;
                    }

                    snapshot.forEach((doc) => {
                        const booking = doc.data();
                        const statusColors = {
                            'confirmed': 'bg-green-100 text-green-700 border-green-200',
                            'completed': 'bg-blue-100 text-blue-700 border-blue-200',
                            'cancelled': 'bg-red-100 text-red-700 border-red-200'
                        };
                        const statusLabels = {
                            'confirmed': 'Dikonfirmasi',
                            'completed': 'Selesai',
                            'cancelled': 'Dibatalkan'
                        };

                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'bg-gray-50 rounded-xl p-4 fade-in';
                        
                        bookingCard.innerHTML = `
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                            <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold text-gray-800">${booking.customerName}</h3>
                                            <span class="text-xs px-2 py-1 rounded-full border ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}">${statusLabels[booking.status] || booking.status}</span>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                        <div class="flex items-center gap-1">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                            </svg>
                                            ${booking.phoneNumber}
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                            </svg>
                                            ${serviceNames[booking.service] || booking.service}
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            ${new Date(booking.date).toLocaleDateString('id-ID')}
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            ${booking.time}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <select class="status-select px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none" data-id="${doc.id}">
                                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Dikonfirmasi</option>
                                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Selesai</option>
                                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
                                    </select>
                                    <button class="delete-booking text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors" data-id="${doc.id}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;

                        bookingCard.querySelector('.status-select').addEventListener('change', (e) => {
                            updateBookingStatus(doc.id, e.target.value);
                        });

                        bookingCard.querySelector('.delete-booking').addEventListener('click', () => {
                            if (confirm('Hapus booking ini?')) {
                                db.collection('bookings').doc(doc.id).delete();
                            }
                        });

                        adminBookingsList.appendChild(bookingCard);
                    });
                });
            });
    }

    function updateBookingStatus(bookingId, newStatus) {
        db.collection('bookings').doc(bookingId).update({ status: newStatus })
            .then(() => {
                console.log('Status updated successfully');
            })
            .catch((error) => {
                alert(`Gagal update status: ${error.message}`);
            });
    }

    function loadStats() {
        db.collection('bookings').onSnapshot((snapshot) => {
            const total = snapshot.size;
            const confirmed = snapshot.docs.filter(d => d.data().status === 'confirmed').length;
            const completed = snapshot.docs.filter(d => d.data().status === 'completed').length;
            const cancelled = snapshot.docs.filter(d => d.data().status === 'cancelled').length;

            document.getElementById('statTotal').textContent = total;
            document.getElementById('statConfirmed').textContent = confirmed;
            document.getElementById('statCompleted').textContent = completed;
            document.getElementById('statCancelled').textContent = cancelled;
        });
    }

    refreshAdminBookingsBtn.addEventListener('click', loadAllBookings);

    checkSlotsBtn.addEventListener('click', () => {
        const selectedDate = adminDateSelect.value;
        if (!selectedDate) {
            alert('Pilih tanggal terlebih dahulu');
            return;
        }

        db.collection('bookings')
            .where('date', '==', selectedDate)
            .where('status', '==', 'confirmed')
            .get()
            .then((snapshot) => {
                const bookedTimes = snapshot.docs.map(d => d.data().time);
                db.collection('settings').doc('timeSlots').get().then((doc) => {
                    const allSlots = doc.data().slots;
                    const available = allSlots.filter(s => !bookedTimes.includes(s.time));
                    
                    if (available.length === 0) {
                        availableSlotsContainer.innerHTML = '<p class="text-gray-500">Tidak ada waktu tersedia untuk tanggal ini</p>';
                    } else {
                        availableSlotsContainer.innerHTML = '<p class="text-sm text-gray-600 mb-3">Waktu Tersedia:</p><div class="flex flex-wrap gap-2">' +
                            available.map(s => `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">${s.time}</span>`).join(' ') +
                            '</div>';
                    }
                });
            });
    });
});