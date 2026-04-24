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
                authStatus.textContent = `Login berhasil sebagai ${user.displayName}`;
                authStatus.className = 'status success';
                authStatus.style.display = 'block';
                showBookingSection();
            })
            .catch((error) => {
                authStatus.textContent = `Login gagal: ${error.message}`;
                authStatus.className = 'status error';
                authStatus.style.display = 'block';
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
            authStatus.textContent = '';
            authStatus.style.display = 'none';
            userInfo.innerHTML = '';
        }
    });

    function updateUserInfo(user) {
        userInfo.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" class="user-avatar">
            <span>${user.displayName}</span>
        `;
        // Add sign out button
        const signOutBtn = document.createElement('button');
        signOutBtn.textContent = 'Logout';
        signOutBtn.className = 'btn btn-secondary';
        signOutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                hideAppSections();
                userInfo.innerHTML = '';
            });
        });
        userInfo.appendChild(signOutBtn);
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
            bookingStatus.textContent = 'Harap isi semua field';
            bookingStatus.className = 'status error';
            bookingStatus.style.display = 'block';
            return;
        }

        // Add booking to Firestore
        db.collection('bookings').add(bookingData)
            .then((docRef) => {
                bookingStatus.textContent = 'Janji temu berhasil dibuat!';
                bookingStatus.className = 'status success';
                bookingStatus.style.display = 'block';
                bookingForm.reset();
                loadMyBookings(user.uid); // Refresh bookings list
            })
            .catch((error) => {
                bookingStatus.textContent = `Gagal membuat janji temu: ${error.message}`;
                bookingStatus.className = 'status error';
                bookingStatus.style.display = 'block';
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

                    snapshot.forEach((doc) => {
                        const booking = doc.data();
                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'booking-card';
                        bookingCard.dataset.id = doc.id;

                        bookingCard.innerHTML = `
                            <div class="booking-info">
                                <h3>${serviceNames[booking.service] || booking.service}</h3>
                                <p><strong>Nama:</strong> ${booking.customerName}</p>
                                <p><strong>Telepon:</strong> ${booking.phoneNumber}</p>
                                <p><strong>Tanggal:</strong> ${new Date(booking.date).toLocaleDateString('id-ID')}</p>
                                <p><strong>Waktu:</strong> ${booking.time}</p>
                                <p><strong>Status:</strong> <span class="status-badge">${booking.status}</span></p>
                            </div>
                            <div class="booking-actions">
                                <button class="btn btn-sm btn-danger cancel-booking">Batalkan</button>
                            </div>
                        `;

                        // Add cancel functionality
                        const cancelBtn = bookingCard.querySelector('.cancel-booking');
                        cancelBtn.addEventListener('click', () => {
                            if (confirm('Apakah Anda yakin ingin membatalkan janji temu ini?')) {
                                db.collection('bookings').doc(doc.id).update({ status: 'cancelled' })
                                    .then(() => {
                                        // Booking will be updated via real-time listener
                                    })
                                    .catch((error) => {
                                        alert(`Gagal membatalkan: ${error.message}`);
                                    });
                            }
                        });

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