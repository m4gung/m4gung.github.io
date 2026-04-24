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
    let lastBookingId = '';
    let lastBookingTime = null;

    adminYearSpan.textContent = new Date().getFullYear();

    const today = new Date().toISOString().split('T')[0];
    adminDateSelect.min = today;
    adminDateSelect.value = today;

    const adminUserInfo = document.getElementById('adminUserInfo');

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'icon-192.png',
                badge: 'icon-192.png'
            });
        }
    }

    function showLoginForm() {
        adminUserInfo.innerHTML = `
            <div class="admin-login-form">
                <input type="password" id="adminPassword" placeholder="Password Admin" class="form-control">
                <button id="adminLoginBtn" class="btn btn-primary">Login</button>
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
            <span>Admin</span>
            <button id="adminLogout" class="btn btn-secondary">Logout</button>
        `;
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
                if (!snapshot.empty) {
                    const latestBooking = snapshot.docs[0].data();
                    const latestId = snapshot.docs[0].id;
                    const createdAt = latestBooking.createdAt ? latestBooking.createdAt.toMillis() : 0;
                    
                    if (lastBookingId !== '' && latestId !== lastBookingId) {
                        db.collection('settings').doc('services').get().then((servicesDoc) => {
                            let serviceName = latestBooking.service;
                            if (servicesDoc.exists) {
                                const services = servicesDoc.data().services;
                                const found = services.find(s => s.id === latestBooking.service);
                                if (found) serviceName = found.name;
                            }
                            
                            showNotification(
                                'Booking Baru!',
                                `${latestBooking.customerName} - ${serviceName}\n${latestBooking.date} jam ${latestBooking.time}`
                            );
                        });
                    }
                    
                    lastBookingId = latestId;
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
                    serviceCard.className = 'service-card';
                    serviceCard.innerHTML = `
                        <div class="service-info">
                            <h4>${service.name}</h4>
                            <p>Harga: Rp ${service.price.toLocaleString('id-ID')}</p>
                            <p>Durasi: ${service.duration} menit</p>
                        </div>
                        <div class="service-actions">
                            <button class="btn btn-sm btn-danger delete-service" data-id="${service.id}">Hapus</button>
                        </div>
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
                    slotCard.className = 'time-slot-card';
                    slotCard.innerHTML = `
                        <div class="slot-info">
                            <h4>${slot.time}</h4>
                        </div>
                        <div class="slot-actions">
                            <button class="btn btn-sm btn-danger delete-time-slot" data-id="${slot.id}">Hapus</button>
                        </div>
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

                    snapshot.forEach((doc) => {
                        const booking = doc.data();
                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'booking-card';
                        
                        const statusClass = booking.status === 'confirmed' ? 'success' : 
                                            booking.status === 'completed' ? 'info' : 'error';

                        bookingCard.innerHTML = `
                            <div class="booking-info">
                                <h3>${booking.customerName}</h3>
                                <p><strong>Telepon:</strong> ${booking.phoneNumber}</p>
                                <p><strong>Layanan:</strong> ${serviceNames[booking.service] || booking.service}</p>
                                <p><strong>Tanggal:</strong> ${new Date(booking.date).toLocaleDateString('id-ID')}</p>
                                <p><strong>Waktu:</strong> ${booking.time}</p>
                                <p><strong>Status:</strong> 
                                    <select class="status-select" data-id="${doc.id}">
                                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </p>
                            </div>
                            <div class="booking-actions">
                                <button class="btn btn-sm btn-danger delete-booking" data-id="${doc.id}">Hapus</button>
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

            statsContainer.innerHTML = `
                <div class="stat-card">
                    <h3>Total</h3>
                    <p class="stat-number">${total}</p>
                </div>
                <div class="stat-card">
                    <h3>Confirmed</h3>
                    <p class="stat-number">${confirmed}</p>
                </div>
                <div class="stat-card">
                    <h3>Completed</h3>
                    <p class="stat-number">${completed}</p>
                </div>
                <div class="stat-card">
                    <h3>Cancelled</h3>
                    <p class="stat-number">${cancelled}</p>
                </div>
            `;
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
                    
                    availableSlotsContainer.innerHTML = '<h3>Waktu Tersedia:</h3>' +
                        available.map(s => `<span class="available-slot">${s.time}</span>`).join(' ');
                });
            });
    });
});