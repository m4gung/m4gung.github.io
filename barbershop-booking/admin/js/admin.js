document.addEventListener('DOMContentLoaded', () => {
    const adminBookingsList = document.getElementById('adminBookingsList');
    const adminDateSelect = document.getElementById('adminDateSelect');
    const availableSlotsContainer = document.getElementById('availableSlotsContainer');
    const checkSlotsBtn = document.getElementById('checkSlotsBtn');
    const adminYearSpan = document.getElementById('adminYear');

    let lastBookingTime = 0;
    let fcmToken = null;

    adminYearSpan.textContent = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    adminDateSelect.min = today;
    adminDateSelect.value = today;

    const adminUserInfo = document.getElementById('adminUserInfo');

    async function requestFCMPermission() {
        if (!messaging) {
            console.log('FCM not available');
            return;
        }
        
        // Handle foreground messages
        messaging.onMessage((payload) => {
            console.log('Foreground message received:', payload);
            const notificationTitle = payload.notification.title || 'Booking Baru!';
            const notificationOptions = {
                body: payload.notification.body || 'Ada booking baru',
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: 'booking-notification'
            };
            
            if (Notification.permission === 'granted') {
                new Notification(notificationTitle, notificationOptions);
            }
        });
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                fcmToken = await messaging.getToken({
                    vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-I1deZFgEGUoG0lY9nb4UUbL_VGXMwN0fjH9M7M4Kwam97R8z-C8yCX9C4g'
                });
                console.log('FCM Token:', fcmToken);
                await saveTokenToFirestore(fcmToken);
            }
        } catch (e) {
            console.log('FCM permission error:', e);
        }
    }

    async function saveTokenToFirestore(token) {
        if (!token) return;
        // Simpan token dengan timestamp untuk identifikasi device
        await db.collection('settings').doc('adminTokens').set({ 
            token: token,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    function showInAppNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: 'icon-192.png', badge: 'icon-192.png' });
        }
    }

    function showLoginForm() {
        // Clear main sections until logged in
        document.getElementById('statsSection').style.display = 'none';
        document.getElementById('bookingsSection').style.display = 'none';
        document.getElementById('kepstersManagementSection').style.display = 'none';
        document.getElementById('servicesManagementSection').style.display = 'none';
        document.getElementById('timeSlotsManagementSection').style.display = 'none';
        document.getElementById('slotsSection').style.display = 'none';

        adminUserInfo.innerHTML = `
            <div class="relative flex flex-col items-end">
                <button id="adminGoogleLoginBtn" class="bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Login Admin
                </button>
                <p id="adminAuthError" class="text-xs text-red-400 hidden mt-1 absolute top-full right-0 whitespace-nowrap"></p>
            </div>
        `;
        document.getElementById('adminGoogleLoginBtn').addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(error => {
                const errorEl = document.getElementById('adminAuthError');
                if(errorEl) { errorEl.textContent = error.message; errorEl.classList.remove('hidden'); }
            });
        });
    }

    function initializeApp(user) {
        // Show main sections
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('bookingsSection').style.display = 'block';
        document.getElementById('kepstersManagementSection').style.display = 'block';
        document.getElementById('servicesManagementSection').style.display = 'block';
        document.getElementById('timeSlotsManagementSection').style.display = 'block';
        document.getElementById('slotsSection').style.display = 'block';

        adminUserInfo.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${user.photoURL || ''}" alt="Admin" class="w-8 h-8 rounded-full border border-gray-600 bg-gray-700">
                <div class="hidden sm:block text-right">
                    <p class="text-sm font-medium text-white">${user.displayName || 'Admin'}</p>
                    <p class="text-xs text-gray-400">${user.email}</p>
                </div>
                <button id="enableNotifBtn" class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg text-xs transition-colors" title="Aktifkan Notifikasi">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                </button>
                <button id="adminLogout" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors">Logout</button>
            </div>
        `;
        
        const enableNotifBtn = document.getElementById('enableNotifBtn');
        if (enableNotifBtn) {
            enableNotifBtn.addEventListener('click', () => { requestFCMPermission(); });
        }
        
        document.getElementById('adminLogout').addEventListener('click', () => {
            auth.signOut();
        });
        
        requestFCMPermission();
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
                    const createdAt = latestBooking.createdAt ? latestBooking.createdAt.toMillis() : 0;
                    
                    if (lastBookingTime > 0 && createdAt > lastBookingTime) {
                        db.collection('settings').doc('services').get().then((servicesDoc) => {
                            let serviceName = latestBooking.service;
                            if (servicesDoc.exists) {
                                const services = servicesDoc.data().services;
                                const found = services.find(s => s.id === latestBooking.service);
                                if (found) serviceName = found.name;
                            }
                            
                            showInAppNotification(
                                'Booking Baru!',
                                `${latestBooking.customerName} - ${serviceName}\n${latestBooking.date} jam ${latestBooking.time}`
                            );
                        });
                    }
                    
                    lastBookingTime = createdAt;
                }
            });
    }

    // Start listening to auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin
            const adminDoc = await db.collection('settings').doc('admins').get();
            let isAdmin = false;
            
            if (!adminDoc.exists) {
                // First login becomes the admin automatically
                await db.collection('settings').doc('admins').set({ emails: [user.email] });
                isAdmin = true;
            } else {
                const emails = adminDoc.data().emails || [];
                if (emails.includes(user.email)) {
                    isAdmin = true;
                }
            }

            if (isAdmin) {
                initializeApp(user);
            } else {
                alert('Akses ditolak: Email Anda (' + user.email + ') tidak terdaftar sebagai admin.');
                auth.signOut();
            }
        } else {
            // Hide sections and show login
            document.getElementById('statsSection').style.display = 'none';
            document.getElementById('bookingsSection').style.display = 'none';
            document.getElementById('kepstersManagementSection').style.display = 'none';
            document.getElementById('servicesManagementSection').style.display = 'none';
            document.getElementById('timeSlotsManagementSection').style.display = 'none';
            document.getElementById('slotsSection').style.display = 'none';
            showLoginForm();
        }
    });

    async function initializeData() {
        let snap = await db.collection('settings').doc('kepsters').get();
        if (!snap.exists) await db.collection('settings').doc('kepsters').set({ kepsters: [{ id: 'kepster-1', name: 'Budi (Default)' }] });
        
        snap = await db.collection('settings').doc('services').get();
        if (!snap.exists) await db.collection('settings').doc('services').set({ services: [{ id: 'haircut', name: 'Potong Rambut', price: 30000, duration: 30 },{ id: 'shave', name: 'Goyang', price: 25000, duration: 20 },{ id: 'beard', name: 'Perawatan Jenggot', price: 20000, duration: 20 },{ id: 'package', name: 'Paket Lengkap', price: 70000, duration: 60 }]});
        
        snap = await db.collection('settings').doc('timeSlots').get();
        if (!snap.exists) { let slots = []; for (let h = 9; h < 18; h++) for (let m = 0; m < 60; m += 30) slots.push({ id: h + ':' + m, time: (h+'').padStart(2,'0') + ':' + (m+'').padStart(2,'0') }); await db.collection('settings').doc('timeSlots').set({ slots }); }
        
        renderKepsters();
        renderServices();
        renderTimeSlots();
    }

    function renderKepsters() {
        db.collection('settings').doc('kepsters').onSnapshot(doc => {
            let html = '';
            if (doc.exists) {
                doc.data().kepsters.forEach(k => {
                    html += '<div class="bg-gray-50 rounded-xl p-4 flex justify-between items-center"><h4 class="font-semibold">' + k.name + '</h4><button class="delete-kepster text-red-500 hover:text-red-700" data-id="' + k.id + '"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>';
                });
            }
            document.getElementById('kepstersList').innerHTML = html;
            
            document.querySelectorAll('.delete-kepster').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Hapus kepster ini?')) {
                        const id = e.target.closest('button').getAttribute('data-id');
                        const docRef = db.collection('settings').doc('kepsters');
                        const snap = await docRef.get();
                        const kepsters = snap.data().kepsters.filter(k => k.id !== id);
                        docRef.update({ kepsters });
                    }
                });
            });
        });
    }

    document.getElementById('addKepsterBtn').addEventListener('click', async () => {
        const name = document.getElementById('newKepsterName').value.trim();
        if (!name) return alert('Nama kepster harus diisi');
        
        const docRef = db.collection('settings').doc('kepsters');
        const snap = await docRef.get();
        let kepsters = snap.exists ? (snap.data().kepsters || []) : [];
        kepsters.push({ id: 'kepster-' + Date.now(), name });
        await docRef.set({ kepsters }, { merge: true });
        
        document.getElementById('newKepsterName').value = '';
    });

    function renderServices() {
        db.collection('settings').doc('services').onSnapshot(doc => {
            let html = '';
            if (doc.exists) {
                doc.data().services.forEach(s => { 
                    html += `<div class="bg-gray-50 rounded-xl p-4 relative">
                        <h4 class="font-semibold">${s.name}</h4>
                        <p class="text-sm text-gray-500">Rp ${s.price.toLocaleString('id-ID')} - ${s.duration} menit</p>
                        <button class="delete-service absolute top-2 right-2 text-red-500 hover:text-red-700 p-1" data-id="${s.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>`; 
                });
            }
            document.getElementById('servicesList').innerHTML = html;

            document.querySelectorAll('.delete-service').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Hapus layanan ini?')) {
                        const id = e.target.closest('button').getAttribute('data-id');
                        const docRef = db.collection('settings').doc('services');
                        const snap = await docRef.get();
                        const services = snap.data().services.filter(s => s.id !== id);
                        docRef.update({ services });
                    }
                });
            });
        });
    }

    function renderTimeSlots() {
        db.collection('settings').doc('timeSlots').onSnapshot(doc => {
            let html = '';
            if (doc.exists) {
                doc.data().slots.sort((a,b) => a.time.localeCompare(b.time)).forEach(s => { 
                    html += `<div class="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                        <span class="font-medium">${s.time}</span>
                        <button class="delete-slot text-red-500 hover:text-red-700 p-1" data-id="${s.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>`; 
                });
            }
            document.getElementById('timeSlotsList').innerHTML = html;
            
            document.querySelectorAll('.delete-slot').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Hapus waktu ini?')) {
                        const id = e.target.closest('button').getAttribute('data-id');
                        const docRef = db.collection('settings').doc('timeSlots');
                        const snap = await docRef.get();
                        const slots = snap.data().slots.filter(s => s.id !== id);
                        docRef.update({ slots });
                    }
                });
            });
        });
    }

    function loadAllBookings() {
        db.collection('bookings').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            if (snapshot.empty) { document.getElementById('adminBookingsList').innerHTML = '<p class="text-center text-gray-500 py-8">Belum ada booking</p>'; return; }
            
            Promise.all([
                db.collection('settings').doc('services').get(),
                db.collection('settings').doc('kepsters').get()
            ]).then(([servicesDoc, kepstersDoc]) => {
                let names = {}; 
                if (servicesDoc.exists) servicesDoc.data().services.forEach(s => names[s.id] = s.name);
                
                let kepsterNames = {};
                if (kepstersDoc.exists) kepstersDoc.data().kepsters.forEach(k => kepsterNames[k.id] = k.name);

                let html = '';
                snapshot.forEach(d => {
                    const b = d.data();
                    const colors = { confirmed: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };
                    const labels = { confirmed: 'Dikonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan' };
                    const kepsterDisplay = b.kepster ? (kepsterNames[b.kepster] || b.kepster) : '-';
                    
                    html += '<div class="bg-gray-50 rounded-xl p-4 mb-3"><div class="flex justify-between"><div><h3 class="font-semibold">' + b.customerName + '</h3><p class="text-sm text-gray-600">Layanan: ' + (names[b.service] || b.service) + '<br>Kepster: ' + kepsterDisplay + '<br>' + new Date(b.date).toLocaleDateString('id-ID') + ' jam ' + b.time + '</p><span class="text-xs px-2 py-1 rounded-full inline-block mt-2 ' + (colors[b.status] || 'bg-gray-100') + '">' + (labels[b.status] || b.status) + '</span></div><div class="flex items-center gap-2"><select class="status-select text-sm border rounded px-2 py-1" data-id="' + d.id + '"><option value="confirmed"' + (b.status==='confirmed'?' selected':'') + '>Dikonfirmasi</option><option value="completed"' + (b.status==='completed'?' selected':'') + '>Selesai</option><option value="cancelled"' + (b.status==='cancelled'?' selected':'') + '>Dibatalkan</option></select><button class="delete-booking text-red-500 hover:text-red-700 p-1 rounded-lg" data-id="' + d.id + '"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div></div>';
                });
                document.getElementById('adminBookingsList').innerHTML = html;
                
                // Attach event listeners
                document.querySelectorAll('.status-select').forEach(el => {
                    el.addEventListener('change', (e) => {
                        const id = e.target.getAttribute('data-id');
                        const status = e.target.value;
                        db.collection('bookings').doc(id).update({ status }).catch(err => alert('Gagal mengupdate status: ' + err.message));
                    });
                });
                document.querySelectorAll('.delete-booking').forEach(el => {
                    el.addEventListener('click', (e) => {
                        if (confirm('Apakah Anda yakin ingin menghapus booking ini?')) {
                            const id = e.target.closest('button').getAttribute('data-id');
                            db.collection('bookings').doc(id).delete().catch(err => alert('Gagal menghapus: ' + err.message));
                        }
                    });
                });
            });
        });
    }

    function loadStats() {
        db.collection('bookings').onSnapshot(snap => {
            document.getElementById('statTotal').textContent = snap.size;
            document.getElementById('statConfirmed').textContent = snap.docs.filter(d => d.data().status === 'confirmed').length;
            document.getElementById('statCompleted').textContent = snap.docs.filter(d => d.data().status === 'completed').length;
            document.getElementById('statCancelled').textContent = snap.docs.filter(d => d.data().status === 'cancelled').length;
        });
    }

    document.getElementById('addServiceBtn').addEventListener('click', async () => {
        const name = document.getElementById('newServiceName').value.trim();
        const price = parseInt(document.getElementById('newServicePrice').value);
        const duration = parseInt(document.getElementById('newServiceDuration').value);
        if (!name || !price || !duration) { alert('Isi semua bidang'); return; }
        
        const docRef = db.collection('settings').doc('services');
        const snap = await docRef.get();
        let services = snap.exists ? (snap.data().services || []) : [];
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        if (!services.some(s => s.id === id)) {
            services.push({ id, name, price, duration });
            await docRef.update({ services });
            document.getElementById('newServiceName').value = '';
            document.getElementById('newServicePrice').value = '';
            document.getElementById('newServiceDuration').value = '';
        } else {
            alert('Layanan dengan nama ini sudah ada.');
        }
    });

    document.getElementById('addTimeSlotBtn').addEventListener('click', async () => {
        const time = document.getElementById('newTimeSlot').value;
        if (!time) return alert('Pilih waktu');
        const docRef = db.collection('settings').doc('timeSlots');
        const snap = await docRef.get();
        let slots = snap.exists ? (snap.data().slots || []) : [];
        if (!slots.some(s => s.time === time)) { 
            slots.push({ id: time, time }); 
            await docRef.update({ slots }); 
        } else {
            alert('Waktu tersebut sudah ada.');
        }
        document.getElementById('newTimeSlot').value = '';
    });

    document.getElementById('checkSlotsBtn').addEventListener('click', () => {
        const date = adminDateSelect.value;
        if (!date) return;
        db.collection('bookings').where('date', '==', date).where('status', '==', 'confirmed').get().then(snap => {
            const booked = snap.docs.map(d => d.data().time);
            db.collection('settings').doc('timeSlots').get().then(doc => {
                const avail = doc.data().slots.filter(s => !booked.includes(s.time));
                availableSlotsContainer.innerHTML = avail.length ? avail.map(s => '<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">' + s.time + '</span>').join(' ') : 'Tidak ada';
            });
        });
    });
});
