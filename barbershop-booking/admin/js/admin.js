// Admin Dashboard Logic
const ADMIN_PASSWORD = 'password';

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
        await db.collection('settings').doc('adminTokens').set({ token: token }, { merge: true });
    }

    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: 'icon-192.png', badge: 'icon-192.png' });
        }
    }

    function showLoginForm() {
        adminUserInfo.innerHTML = '<div class="flex items-center gap-2"><input type="password" id="adminPassword" placeholder="Password Admin" class="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm"><button id="adminLoginBtn" class="bg-accent text-white px-4 py-2 rounded-lg text-sm">Login</button></div>';
        document.getElementById('adminLoginBtn').addEventListener('click', checkAdminPassword);
    }

    function checkAdminPassword() {
        if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) initializeApp();
        else alert('Password salah!');
    }

    function initializeApp() {
        adminUserInfo.innerHTML = '<div class="flex items-center gap-3"><span class="text-sm font-medium">Admin</span><button id="enableNotifBtn" class="bg-blue-600 px-2 py-1 rounded-lg text-xs">Notif</button><button id="adminLogout" class="bg-white/20 px-3 py-1 rounded-lg text-sm">Logout</button></div>';
        const enableNotifBtn = document.getElementById('enableNotifBtn');
        
        enableNotifBtn.addEventListener('click', () => { requestFCMPermission(); });
        document.getElementById('adminLogout').addEventListener('click', showLoginForm);
        
        requestFCMPermission();
        initializeData();
        loadAllBookings();
        loadStats();
        listenForNewBookings();
    }

    function listenForNewBookings() {
        db.collection('bookings').orderBy('createdAt', 'desc').limit(1).onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const b = snapshot.docs[0].data();
                const createdAt = b.createdAt ? b.createdAt.toMillis() : 0;
                if (lastBookingTime > 0 && createdAt > lastBookingTime) {
                    db.collection('settings').doc('services').get().then(doc => {
                        let name = b.service;
                        if (doc.exists) { const f = doc.data().services.find(s => s.id === b.service); if (f) name = f.name; }
                        const msg = b.customerName + ' - ' + name + '\n' + b.date + ' jam ' + b.time;
                        alert('Booking Baru!\n\n' + msg);
                        showNotification('Booking Baru!', msg);
                    });
                }
                lastBookingTime = createdAt;
            }
        });
    }

    showLoginForm();

    async function initializeData() {
        let snap = await db.collection('settings').doc('services').get();
        if (!snap.exists) await db.collection('settings').doc('services').set({ services: [{ id: 'haircut', name: 'Potong Rambut', price: 30000, duration: 30 },{ id: 'shave', name: 'Goyang', price: 25000, duration: 20 },{ id: 'beard', name: 'Perawatan Jenggot', price: 20000, duration: 20 },{ id: 'package', name: 'Paket Lengkap', price: 70000, duration: 60 }]});
        snap = await db.collection('settings').doc('timeSlots').get();
        if (!snap.exists) { let slots = []; for (let h = 9; h < 18; h++) for (let m = 0; m < 60; m += 30) slots.push({ id: h + ':' + m, time: (h+'').padStart(2,'0') + ':' + (m+'').padStart(2,'0') }); await db.collection('settings').doc('timeSlots').set({ slots }); }
        renderServices();
        renderTimeSlots();
    }

    function renderServices() {
        db.collection('settings').doc('services').onSnapshot(doc => {
            let html = '';
            if (doc.exists) doc.data().services.forEach(s => { html += '<div class="bg-gray-50 rounded-xl p-4"><h4 class="font-semibold">' + s.name + '</h4><p class="text-sm text-gray-500">Rp ' + s.price.toLocaleString('id-ID') + ' - ' + s.duration + ' menit</p></div>'; });
            document.getElementById('servicesList').innerHTML = html;
        });
    }

    function renderTimeSlots() {
        db.collection('settings').doc('timeSlots').onSnapshot(doc => {
            let html = '';
            if (doc.exists) doc.data().slots.sort((a,b) => a.time.localeCompare(b.time)).forEach(s => { html += '<div class="bg-gray-50 rounded-xl p-3"><span class="font-medium">' + s.time + '</span></div>'; });
            document.getElementById('timeSlotsList').innerHTML = html;
        });
    }

    function loadAllBookings() {
        db.collection('bookings').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            if (snapshot.empty) { document.getElementById('adminBookingsList').innerHTML = '<p class="text-center text-gray-500 py-8">Belum ada booking</p>'; return; }
            db.collection('settings').doc('services').get().then(doc => {
                let names = {}; if (doc.exists) doc.data().services.forEach(s => names[s.id] = s.name);
                let html = '';
                snapshot.forEach(d => {
                    const b = d.data();
                    const colors = { confirmed: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };
                    const labels = { confirmed: 'Dikonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan' };
                    html += '<div class="bg-gray-50 rounded-xl p-4 mb-3"><div class="flex justify-between"><div><h3 class="font-semibold">' + b.customerName + '</h3><p class="text-sm text-gray-600">' + (names[b.service] || b.service) + ' | ' + new Date(b.date).toLocaleDateString('id-ID') + ' jam ' + b.time + '</p><span class="text-xs px-2 py-1 rounded-full ' + (colors[b.status] || 'bg-gray-100') + '">' + (labels[b.status] || b.status) + '</span></div><select class="text-sm border rounded px-2 py-1" data-id="' + d.id + '"><option value="confirmed"' + (b.status==='confirmed'?' selected':'') + '>Dikonfirmasi</option><option value="completed"' + (b.status==='completed'?' selected':'') + '>Selesai</option><option value="cancelled"' + (b.status==='cancelled'?' selected':'') + '>Dibatalkan</option></select></div></div>';
                });
                document.getElementById('adminBookingsList').innerHTML = html;
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
        if (!name || !price || !duration) { alert('Isi semua'); return; }
        const doc = await db.collection('settings').doc('services').get();
        doc.data().services.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, price, duration });
        await db.collection('settings').doc('services').update({ services: doc.data().services });
    });

    document.getElementById('addTimeSlotBtn').addEventListener('click', async () => {
        const time = document.getElementById('newTimeSlot').value;
        if (!time) return;
        const doc = await db.collection('settings').doc('timeSlots').get();
        if (!doc.data().slots.some(s => s.time === time)) { doc.data().slots.push({ id: time, time }); await db.collection('settings').doc('timeSlots').update({ slots: doc.data().slots }); }
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
