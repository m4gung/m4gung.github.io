import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, String> _servicesCache = {};
  Map<String, String> _kepstersCache = {};

  @override
  void initState() {
    super.initState();
    _loadMetadata();
  }

  Future<void> _loadMetadata() async {
    final servicesSnap = await FirebaseFirestore.instance.collection('settings').doc('services').get();
    if (servicesSnap.exists) {
      final List services = servicesSnap.data()?['services'] ?? [];
      for (var s in services) {
        _servicesCache[s['id']] = s['name'];
      }
    }

    final kepstersSnap = await FirebaseFirestore.instance.collection('settings').doc('kepsters').get();
    if (kepstersSnap.exists) {
      final List kepsters = kepstersSnap.data()?['kepsters'] ?? [];
      for (var k in kepsters) {
        _kepstersCache[k['id']] = k['name'];
      }
    }
    setState(() {});
  }

  void _updateBookingStatus(String docId, String newStatus) {
    FirebaseFirestore.instance.collection('bookings').doc(docId).update({'status': newStatus});
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  void _showCheckSlotsBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => const _CheckSlotsBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Semua Booking', style: TextStyle(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              await GoogleSignIn().signOut();
            },
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('bookings').orderBy('createdAt', descending: true).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const Center(child: Text('Belum ada janji temu.'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;
              final docId = docs[index].id;
              
              final serviceName = _servicesCache[data['service']] ?? data['service'] ?? '-';
              final kepsterName = _kepstersCache[data['kepster']] ?? data['kepster'] ?? '-';
              final status = data['status'] ?? 'confirmed';
              
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              data['customerName'] ?? 'No Name',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getStatusColor(status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getStatusLabel(status),
                              style: TextStyle(
                                color: _getStatusColor(status),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Layanan: $serviceName'),
                      Text('Kepster: $kepsterName'),
                      Text('Waktu: ${data['date']} jam ${data['time']}'),
                      Text('No. HP: ${data['phoneNumber']}'),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          DropdownButton<String>(
                            value: status,
                            underline: const SizedBox(),
                            items: const [
                              DropdownMenuItem(value: 'confirmed', child: Text('Dikonfirmasi')),
                              DropdownMenuItem(value: 'completed', child: Text('Selesai')),
                              DropdownMenuItem(value: 'cancelled', child: Text('Dibatalkan')),
                            ],
                            onChanged: (newStatus) {
                              if (newStatus != null) {
                                _updateBookingStatus(docId, newStatus);
                              }
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Hapus Booking'),
                                  content: const Text('Yakin ingin menghapus booking ini?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Batal'),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        FirebaseFirestore.instance.collection('bookings').doc(docId).delete();
                                        Navigator.pop(context);
                                      },
                                      child: const Text('Hapus', style: TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCheckSlotsBottomSheet,
        icon: const Icon(Icons.search),
        label: const Text('Cek Jadwal'),
      ),
    );
  }
}

class _CheckSlotsBottomSheet extends StatefulWidget {
  const _CheckSlotsBottomSheet();

  @override
  State<_CheckSlotsBottomSheet> createState() => _CheckSlotsBottomSheetState();
}

class _CheckSlotsBottomSheetState extends State<_CheckSlotsBottomSheet> {
  String? _selectedDate;
  String? _selectedKepster;
  List<Map<String, dynamic>> _kepsters = [];
  List<String> _availableSlots = [];
  bool _hasChecked = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadKepsters();
  }

  Future<void> _loadKepsters() async {
    final snap = await FirebaseFirestore.instance.collection('settings').doc('kepsters').get();
    if (snap.exists) {
      final List kepsters = snap.data()?['kepsters'] ?? [];
      setState(() {
        _kepsters = List<Map<String, dynamic>>.from(kepsters);
      });
    }
  }

  Future<void> _checkAvailability() async {
    if (_selectedDate == null || _selectedKepster == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih kepster dan tanggal.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final bookingsSnap = await FirebaseFirestore.instance
          .collection('bookings')
          .where('date', isEqualTo: _selectedDate)
          .get();

      final bookedTimes = bookingsSnap.docs
          .map((d) => d.data())
          .where((b) => b['kepster'] == _selectedKepster && (b['status'] == 'confirmed' || b['status'] == 'completed'))
          .map((b) => b['time'] as String)
          .toList();

      final slotsSnap = await FirebaseFirestore.instance.collection('settings').doc('timeSlots').get();
      List<String> allSlots = [];
      if (slotsSnap.exists) {
        final List slotsData = slotsSnap.data()?['slots'] ?? [];
        allSlots = slotsData.map((s) => s['time'] as String).toList();
      }

      setState(() {
        _availableSlots = allSlots.where((s) => !bookedTimes.contains(s)).toList();
        _hasChecked = true;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Cek Ketersediaan', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(labelText: 'Pilih Kepster', border: OutlineInputBorder()),
            value: _selectedKepster,
            items: _kepsters.map((k) {
              return DropdownMenuItem<String>(
                value: k['id'],
                child: Text(k['name']),
              );
            }).toList(),
            onChanged: (val) => setState(() {
              _selectedKepster = val;
              _hasChecked = false;
            }),
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (date != null) {
                setState(() {
                  _selectedDate = DateFormat('yyyy-MM-dd').format(date);
                  _hasChecked = false;
                });
              }
            },
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Pilih Tanggal', border: OutlineInputBorder()),
              child: Text(_selectedDate ?? 'Pilih Tanggal'),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isLoading ? null : _checkAvailability,
            child: _isLoading ? const CircularProgressIndicator() : const Text('Cek Ketersediaan'),
          ),
          const SizedBox(height: 24),
          if (_hasChecked) ...[
            const Text('Slot Tersedia:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _availableSlots.isEmpty
                ? const Text('Tidak ada slot tersedia.', style: TextStyle(color: Colors.red))
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableSlots.map((s) => Chip(
                      label: Text(s),
                      backgroundColor: Colors.green.shade100,
                    )).toList(),
                  ),
            const SizedBox(height: 24),
          ],
        ],
      ),
    );
  }
}
