import 'package:flutter/material.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../../../core/services/backup_service.dart';
import '../../../core/services/google_sheets_sync_service.dart';
import '../../../core/services/printer_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  List<BluetoothInfo> _pairedDevices = [];
  bool _isScanning = false;
  bool _isBluetoothOn = true;
  String? _connectedDeviceMac;
  ReceiptPaperSize _paperSize = PrinterService.instance.paperSize;
  PrinterConnectionType _connectionType = PrinterService.instance.connectionType;
  bool _autoOpenCashDrawer = PrinterService.instance.autoOpenCashDrawer;
  late final TextEditingController _ipController;
  late final TextEditingController _portController;
  late final TextEditingController _gasUrlController;
  bool _isSyncingSheets = false;
  bool _isBackingUp = false;
  String? _lastSyncAt;

  @override
  void initState() {
    super.initState();
    _ipController = TextEditingController(
      text: PrinterService.instance.networkIp.isNotEmpty
          ? PrinterService.instance.networkIp
          : '192.168.1.100',
    );
    _portController = TextEditingController(
      text: PrinterService.instance.networkPort.toString(),
    );
    _gasUrlController = TextEditingController();
    _loadCloudSettings();
    _scanPrinters();
  }

  Future<void> _loadCloudSettings() async {
    final url = await GoogleSheetsSyncService.instance.getSavedWebAppUrl();
    final lastSync = await GoogleSheetsSyncService.instance.getLastSyncAt();
    if (mounted) {
      setState(() {
        _gasUrlController.text = url;
        _lastSyncAt = lastSync;
      });
    }
  }

  @override
  void dispose() {
    _ipController.dispose();
    _portController.dispose();
    _gasUrlController.dispose();
    super.dispose();
  }

  Future<void> _scanPrinters() async {
    setState(() => _isScanning = true);
    final btEnabled = await PrinterService.instance.isBluetoothEnabled();
    final devices = btEnabled ? await PrinterService.instance.getPairedPrinters() : <BluetoothInfo>[];
    if (mounted) {
      setState(() {
        _isBluetoothOn = btEnabled;
        _pairedDevices = devices;
        _isScanning = false;
      });
    }
  }

  void _showBluetoothGuideDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.bluetooth, color: Color(0xFF2563EB)),
            SizedBox(width: 8),
            Expanded(child: Text('Panduan Printer Bluetooth', style: TextStyle(fontSize: 16))),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Untuk iPhone / iPad (Bluetooth BLE):', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text('1. Geser layar dari pojok kanan atas untuk membuka Control Center dan nyalakan Bluetooth.'),
            Text('2. Pastikan printer thermal (Iware, VSC, Panda, Eppos, BellaV) mendukung BLE dan dalam keadaan menyala.'),
            Text('3. Klik "Pindai Ulang" di aplikasi ini untuk mendeteksi printer BLE tanpa perlu pairing di Pengaturan iOS.'),
            SizedBox(height: 12),
            Text('Untuk HP / Tablet Android:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text('1. Buka Pengaturan Bluetooth Android dan pairing printer terlebih dahulu (PIN umumnya 0000 atau 1234).'),
            Text('2. Kembali ke aplikasi dan tekan "Pindai Ulang".'),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Mengerti'),
          ),
        ],
      ),
    );
  }

  Future<void> _connectToPrinter(BluetoothInfo device) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final success = await PrinterService.instance.connectPrinter(device.macAdress);
    if (success) {
      setState(() {
        _connectedDeviceMac = device.macAdress;
      });
      scaffoldMessenger.showSnackBar(
        SnackBar(content: Text('Terhubung ke ${device.name}')),
      );
    } else {
      scaffoldMessenger.showSnackBar(
        const SnackBar(content: Text('Gagal menghubungkan ke printer')),
      );
    }
  }

  Future<void> _printTest() async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final bytes = [
      27, 64, // init
      27, 97, 1, // center
      ...('TEST CETAK PRINTER THERMAL (${_paperSize == ReceiptPaperSize.mm80 ? '80mm' : '58mm'})\nTOKO BERKAH JAYA\nBERHASIL TERHUBUNG!\n\n\n'.codeUnits),
      29, 86, 66, 0 // cut
    ];

    bool result = false;
    if (_connectionType == PrinterConnectionType.network) {
      final ip = _ipController.text.trim();
      final port = int.tryParse(_portController.text.trim()) ?? 9100;
      PrinterService.instance.networkIp = ip;
      PrinterService.instance.networkPort = port;
      result = await PrinterService.instance.printViaNetwork(bytes, ip: ip, port: port);
    } else {
      result = await PrintBluetoothThermal.writeBytes(bytes);
    }

    if (result) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(content: Text('Cetak tes berhasil!')),
      );
    } else {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text(
            _connectionType == PrinterConnectionType.network
                ? 'Gagal terhubung ke printer LAN (${_ipController.text}:${_portController.text})'
                : 'Gagal mencetak tes',
          ),
        ),
      );
    }
  }

  Future<void> _testCashDrawer() async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final result = await PrinterService.instance.openCashDrawer();
    scaffoldMessenger.showSnackBar(
      SnackBar(
        content: Text(result ? 'Perintah buka laci kasir dikirim!' : 'Gagal membuka laci kasir. Pastikan printer terhubung.'),
      ),
    );
  }

  Future<void> _exportBackup() async {
    setState(() => _isBackingUp = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await BackupService.instance.exportAndShareBackup();
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Gagal membuat backup: $e')));
    } finally {
      if (mounted) setState(() => _isBackingUp = false);
    }
  }

  Future<void> _restoreBackup() async {
    final messenger = ScaffoldMessenger.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Pulihkan Data Toko?'),
        content: const Text(
          'Data produk, pelanggan, transaksi, dan buku kas saat ini akan digantikan oleh isi file backup (.json). Lanjutkan?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Ya, Pulihkan'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isBackingUp = true);
    try {
      final restoredProducts = await BackupService.instance.pickAndRestoreBackup();
      if (restoredProducts != null) {
        messenger.showSnackBar(
          SnackBar(content: Text('Data berhasil dipulihkan! ($restoredProducts produk dimuat)')),
        );
      }
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Gagal memulihkan data: $e')));
    } finally {
      if (mounted) setState(() => _isBackingUp = false);
    }
  }

  Future<void> _testGoogleSheets() async {
    final messenger = ScaffoldMessenger.of(context);
    final url = _gasUrlController.text.trim();
    await GoogleSheetsSyncService.instance.saveWebAppUrl(url);
    setState(() => _isSyncingSheets = true);
    final ok = await GoogleSheetsSyncService.instance.testConnection(url);
    if (mounted) setState(() => _isSyncingSheets = false);
    messenger.showSnackBar(
      SnackBar(
        content: Text(ok
            ? 'Koneksi ke Google Sheets berhasil!'
            : 'Gagal terhubung. Pastikan URL Web App Apps Script benar & sudah di-deploy.'),
      ),
    );
  }

  Future<void> _syncTodayToSheets() async {
    final messenger = ScaffoldMessenger.of(context);
    final url = _gasUrlController.text.trim();
    await GoogleSheetsSyncService.instance.saveWebAppUrl(url);
    setState(() => _isSyncingSheets = true);
    final res = await GoogleSheetsSyncService.instance.syncTodaySalesToSheets(url);
    final lastSync = await GoogleSheetsSyncService.instance.getLastSyncAt();
    if (mounted) {
      setState(() {
        _isSyncingSheets = false;
        _lastSyncAt = lastSync;
      });
    }
    messenger.showSnackBar(SnackBar(content: Text(res.message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengaturan Toko & Printer'),
      ),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Section Info Toko
              const Text('INFORMASI TOKO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Toko Berkah Jaya', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      SizedBox(height: 4),
                      Text('Jl. Pasar Tradisional No. 12, Jakarta'),
                      SizedBox(height: 2),
                      Text('WhatsApp: 0812-3456-7890', style: TextStyle(color: Color(0xFF059669))),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section Backup & Restore Data
              const Text('BACKUP & PULIHKAN DATA TOKO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Simpan cadangan seluruh produk, transaksi, pelanggan, dan buku kas ke file JSON (bisa dikirim ke Google Drive atau WhatsApp).',
                        style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isBackingUp ? null : _exportBackup,
                              icon: const Icon(Icons.backup_outlined),
                              label: Text(_isBackingUp ? 'Memproses...' : 'Ekspor Backup (.json)'),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isBackingUp ? null : _restoreBackup,
                              icon: const Icon(Icons.restore, color: Color(0xFFDC2626)),
                              label: const Text('Pulihkan Data', style: TextStyle(color: Color(0xFFDC2626))),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section Sinkronisasi Google Sheets
              const Text('SINKRONISASI GOOGLE SHEETS (GRATIS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextField(
                        controller: _gasUrlController,
                        decoration: const InputDecoration(
                          labelText: 'URL Web App Google Apps Script',
                          hintText: 'https://script.google.com/macros/s/.../exec',
                          prefixIcon: Icon(Icons.cloud_sync),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                      if (_lastSyncAt != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Sinkron terakhir: $_lastSyncAt',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF059669)),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isSyncingSheets ? null : _testGoogleSheets,
                              icon: const Icon(Icons.wifi_tethering),
                              label: const Text('Tes Koneksi'),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton.icon(
                              onPressed: _isSyncingSheets ? null : _syncTodayToSheets,
                              icon: const Icon(Icons.cloud_upload_outlined),
                              label: Text(
                                _isSyncingSheets ? 'Mengirim...' : 'Kirim Data Hari Ini ke Sheets',
                                overflow: TextOverflow.ellipsis,
                              ),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section Pengaturan Kertas Struk & Laci Kasir (Fase 2 Tablet POS)
              const Text('UKURAN KERTAS & LACI KASIR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              Card(
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Lebar Kertas Printer Thermal', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          SegmentedButton<ReceiptPaperSize>(
                            segments: const [
                              ButtonSegment(value: ReceiptPaperSize.mm58, label: Text('58mm (Mini)')),
                              ButtonSegment(value: ReceiptPaperSize.mm80, label: Text('80mm (Meja POS)')),
                            ],
                            selected: {_paperSize},
                            onSelectionChanged: (selected) {
                              setState(() {
                                _paperSize = selected.first;
                                PrinterService.instance.paperSize = _paperSize;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          const Text('Metode Koneksi Printer Thermal', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          SegmentedButton<PrinterConnectionType>(
                            segments: const [
                              ButtonSegment(
                                value: PrinterConnectionType.bluetooth,
                                icon: Icon(Icons.bluetooth, size: 16),
                                label: Text('Bluetooth'),
                              ),
                              ButtonSegment(
                                value: PrinterConnectionType.network,
                                icon: Icon(Icons.wifi, size: 16),
                                label: Text('WiFi / LAN'),
                              ),
                            ],
                            selected: {_connectionType},
                            onSelectionChanged: (selected) {
                              setState(() {
                                _connectionType = selected.first;
                                PrinterService.instance.connectionType = _connectionType;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      title: const Text('Buka Laci Kasir Otomatis', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: const Text('Otomatis membuka cash drawer RJ11 saat cetak struk'),
                      value: _autoOpenCashDrawer,
                      activeThumbColor: const Color(0xFF059669),
                      onChanged: (val) {
                        setState(() {
                          _autoOpenCashDrawer = val;
                          PrinterService.instance.autoOpenCashDrawer = val;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (_connectionType == PrinterConnectionType.network) ...[
                const Text(
                  'PRINTER JARINGAN (WIFI / LAN ESC/POS)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: TextField(
                                controller: _ipController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(
                                  labelText: 'Alamat IP Printer',
                                  hintText: '192.168.1.100',
                                  prefixIcon: Icon(Icons.router),
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                onChanged: (val) => PrinterService.instance.networkIp = val.trim(),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 1,
                              child: TextField(
                                controller: _portController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Port',
                                  hintText: '9100',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                onChanged: (val) =>
                                    PrinterService.instance.networkPort = int.tryParse(val.trim()) ?? 9100,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _printTest,
                                icon: const Icon(Icons.receipt_long),
                                label: const Text('Simpan & Tes Cetak LAN'),
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _testCashDrawer,
                                icon: const Icon(Icons.point_of_sale),
                                label: const Text('Buka Laci Kasir'),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size.fromHeight(48),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                // Section Printer Bluetooth
                Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('PRINTER THERMAL (BLUETOOTH)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton.icon(
                        onPressed: _showBluetoothGuideDialog,
                        icon: const Icon(Icons.help_outline, size: 16),
                        label: const Text('Panduan'),
                      ),
                      TextButton.icon(
                        onPressed: _scanPrinters,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Pindai Ulang'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (_isScanning)
                const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
              else if (!_isBluetoothOn)
                Card(
                  color: const Color(0xFFFEF3C7),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(Icons.bluetooth_disabled, size: 40, color: Color(0xFFD97706)),
                        const SizedBox(height: 8),
                        const Text(
                          'Bluetooth Belum Aktif',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Nyalakan Bluetooth lewat Control Center (iPhone) atau Pengaturan HP untuk menghubungkan printer thermal.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Color(0xFF78350F)),
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: _showBluetoothGuideDialog,
                          icon: const Icon(Icons.info_outline, size: 16),
                          label: const Text('Lihat Panduan Koneksi'),
                        ),
                      ],
                    ),
                  ),
                )
              else if (_pairedDevices.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(Icons.print_disabled, size: 40, color: Colors.grey),
                        const SizedBox(height: 8),
                        const Text('Tidak ada printer Bluetooth yang tersambung.'),
                        const SizedBox(height: 4),
                        const Text(
                          'Pastikan printer thermal menyala. Pada iPhone gunakan printer BLE, atau lakukan pairing di Bluetooth Android.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        const SizedBox(height: 10),
                        TextButton.icon(
                          onPressed: _showBluetoothGuideDialog,
                          icon: const Icon(Icons.help_outline, size: 16),
                          label: const Text('Panduan Koneksi Printer'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._pairedDevices.map((device) {
                  final isConnected = _connectedDeviceMac == device.macAdress;

                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.print, color: Color(0xFF059669)),
                      title: Text(device.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(device.macAdress, style: const TextStyle(fontSize: 11)),
                      trailing: isConnected
                          ? const Chip(
                              label: Text('Terhubung', style: TextStyle(color: Colors.white, fontSize: 11)),
                              backgroundColor: Color(0xFF059669),
                            )
                          : ElevatedButton(
                              onPressed: () => _connectToPrinter(device),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                minimumSize: const Size(80, 36),
                              ),
                              child: const Text('Hubungkan', style: TextStyle(fontSize: 12)),
                            ),
                    ),
                  );
                }),

              if (_connectedDeviceMac != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _printTest,
                        icon: const Icon(Icons.receipt_long),
                        label: const Text('Cetak Tes Struk'),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _testCashDrawer,
                        icon: const Icon(Icons.point_of_sale),
                        label: const Text('Buka Laci Kasir'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
