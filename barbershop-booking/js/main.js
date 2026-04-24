// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const authSection = document.getElementById('authSection');
    const bookingSection = document.getElementById('bookingSection');
    const myBookingsSection = document.getElementById('myBookingsSection');
    const googleLoginBtn = document.getElementById('googleLogin');
    const authStatus = document.getElementById('authStatus');
    const userInfo = document.getElementById('userInfo');
    const bookingForm = document.getElementById('bookingForm');
    const bookingStatus = document.getElementById('bookingStatus');
    const bookingsList = document.getElementById('bookingsList');
    const refreshBookingsBtn = document.getElementById('refreshBookings');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const serviceSelect = document.getElementById('service');
    const yearSpan = document.getElementById('year');

    // Set current year
    yearSpan.textContent = new Date().getFullYear();

    // Set min date for date input to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Initialize data from Firestore
    async function initializeBookingData() {
        await checkAndGenerateServices();
        await checkAndGenerateTimeSlots();
        loadServicesFromFirestore();
        loadTimeSlotsFromFirestore();
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

    function loadServicesFromFirestore() {
        db.collection('settings').doc('services').onSnapshot((doc) => {
            serviceSelect.innerHTML = '<option value="">-- Pilih Layanan --</option>';
            if (doc.exists) {
                const services = doc.data().services;
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = `${service.name} - Rp ${service.price.toLocaleString('id-ID')}`;
                    serviceSelect.appendChild(option);
                });
            }
        });
    }

    function loadTimeSlotsFromFirestore() {
        db.collection('settings').doc('timeSlots').onSnapshot((doc) => {
            timeSelect.innerHTML = '<option value="">-- Pilih Waktu --</option>';
            if (doc.exists) {
                const slots = doc.data().slots.sort((a, b) => a.time.localeCompare(b.time));
                slots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot.time;
                    option.textContent = slot.time;
                    timeSelect.appendChild(option);
                });
            }
        });
    }

    initializeBookingData();

    // Google login
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                updateUserInfo(user);
                authStatus.innerHTML = `<div class="bg-green-50 text-green-700 px-4 py-3 rounded-xl">Login berhasil sebagai ${user.displayName}</div>`;
                showBookingSection();
            })
            .catch((error) => {
                authStatus.innerHTML = `<div class="bg-red-50 text-red-700 px-4 py-3 rounded-xl">Login gagal: ${error.message}</div>`;
            });
    });

    // Auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateUserInfo(user);
            showBookingSection();
            loadMyBookings(user.uid);
        } else {
            hideAppSections();
            authStatus.innerHTML = '';
            userInfo.innerHTML = '';
        }
    });

    function updateUserInfo(user) {
        userInfo.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${user.photoURL}" alt="${user.displayName}" class="w-8 h-8 rounded-full">
                <span class="text-sm font-medium">${user.displayName}</span>
                <button id="logoutBtn" class="ml-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
                    Logout
                </button>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut().then(() => {
                hideAppSections();
                userInfo.innerHTML = '';
            });
        });
    }

    function showBookingSection() {
        authSection.classList.add('hidden');
        bookingSection.classList.remove('hidden');
        myBookingsSection.classList.remove('hidden');
    }

    function hideAppSections() {
        authSection.classList.remove('hidden');
        bookingSection.classList.add('hidden');
        myBookingsSection.classList.add('hidden');
    }

    // Booking form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const bookingData = {
            customerName: document.getElementById('customerName').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            service: document.getElementById('service').value,
            date: dateInput.value,
            time: timeSelect.value,
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'confirmed'
        };

        // Basic validation
        if (!bookingData.customerName || !bookingData.phoneNumber || !bookingData.service || !bookingData.date || !bookingData.time) {
            bookingStatus.innerHTML = '<div class="bg-red-50 text-red-700 px-4 py-3 rounded-xl">Harap isi semua field</div>';
            return;
        }

        // Add booking to Firestore
        db.collection('bookings').add(bookingData)
            .then((docRef) => {
                bookingStatus.innerHTML = '<div class="bg-green-50 text-green-700 px-4 py-3 rounded-xl">Janji temu berhasil dibuat!</div>';
                bookingForm.reset();
                loadMyBookings(user.uid);
            })
            .catch((error) => {
                bookingStatus.innerHTML = `<div class="bg-red-50 text-red-700 px-4 py-3 rounded-xl">Gagal membuat janji temu: ${error.message}</div>`;
            });
    });

    // Load user's bookings
    function loadMyBookings(userId) {
        db.collection('bookings')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                bookingsList.innerHTML = '';
                
                db.collection('settings').doc('services').get().then((servicesDoc) => {
                    const serviceNames = {};
                    if (servicesDoc.exists) {
                        servicesDoc.data().services.forEach(s => {
                            serviceNames[s.id] = s.name;
                        });
                    }

                    if (snapshot.empty) {
                        bookingsList.innerHTML = `
                            <div class="bg-white rounded-2xl shadow p-8 text-center">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <p class="text-gray-500">Belum ada janji temu</p>
                            </div>
                        `;
                        return;
                    }

                    snapshot.forEach((doc) => {
                        const booking = doc.data();
                        const statusColors = {
                            'confirmed': 'bg-green-100 text-green-700',
                            'completed': 'bg-blue-100 text-blue-700',
                            'cancelled': 'bg-red-100 text-red-700'
                        };
                        const statusLabels = {
                            'confirmed': 'Dikonfirmasi',
                            'completed': 'Selesai',
                            'cancelled': 'Dibatalkan'
                        };

                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'bg-white rounded-2xl shadow card-hover transition-all p-5 fade-in';
                        bookingCard.dataset.id = doc.id;

                        bookingCard.innerHTML = `
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                            <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold text-gray-800">${serviceNames[booking.service] || booking.service}</h3>
                                            <span class="text-xs ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full">${statusLabels[booking.status] || booking.status}</span>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                            </svg>
                                            ${booking.customerName}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                            </svg>
                                            ${booking.phoneNumber}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            ${new Date(booking.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            ${booking.time}
                                        </div>
                                    </div>
                                </div>
                                ${booking.status === 'confirmed' ? `
                                    <button class="cancel-booking bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition-colors text-sm font-medium">
                                        Batalkan
                                    </button>
                                ` : ''}
                            </div>
                        `;

                        const cancelBtn = bookingCard.querySelector('.cancel-booking');
                        if (cancelBtn) {
                            cancelBtn.addEventListener('click', () => {
                                if (confirm('Apakah Anda yakin ingin membatalkan janji temu ini?')) {
                                    db.collection('bookings').doc(doc.id).update({ status: 'cancelled' })
                                        .catch((error) => {
                                            alert(`Gagal membatalkan: ${error.message}`);
                                        });
                                }
                            });
                        }

                        bookingsList.appendChild(bookingCard);
                    });
                });
            });
    }

    // Refresh bookings button
    refreshBookingsBtn.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            loadMyBookings(user.uid);
        }
    });
});