import 'dart:io';

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:printing/printing.dart';
import '../../models/sale_model.dart';
import '../utils/currency_formatter.dart';
import '../utils/date_formatter.dart';

enum PrinterConnectionType {
  bluetooth('Bluetooth (SPP / BLE)'),
  network('WiFi / LAN (IP Port 9100)');

  final String label;
  const PrinterConnectionType(this.label);
}

enum ReceiptPaperSize {
  mm58('58mm (Mini Portable)', PaperSize.mm58),
  mm80('80mm (Meja Kasir / Stand POS)', PaperSize.mm80);

  final String label;
  final PaperSize escPosSize;
  const ReceiptPaperSize(this.label, this.escPosSize);
}

class PrinterService {
  static final PrinterService instance = PrinterService._init();
  PrinterService._init();

  /// Perintah ESC/POS standar untuk membuka laci uang kasir (ESC p 0 25 250).
  static const List<int> cashDrawerKickCommand = [0x1B, 0x70, 0x00, 0x19, 0xFA];

  String? _connectedMac;
  ReceiptPaperSize paperSize = ReceiptPaperSize.mm58;
  PrinterConnectionType connectionType = PrinterConnectionType.bluetooth;
  String networkIp = '';
  int networkPort = 9100;
  bool autoOpenCashDrawer = false;

  bool get isConnected =>
      connectionType == PrinterConnectionType.network
          ? networkIp.trim().isNotEmpty
          : _connectedMac != null;

  /// Cek apakah Bluetooth pada perangkat (Android / iOS BLE) dalam keadaan aktif
  Future<bool> isBluetoothEnabled() async {
    return await PrintBluetoothThermal.bluetoothEnabled;
  }

  /// Scan daftar printer bluetooth terdekat (Classic SPP di Android, BLE di iOS)
  Future<List<BluetoothInfo>> getPairedPrinters() async {
    final bool isBluetoothOn = await PrintBluetoothThermal.bluetoothEnabled;
    if (!isBluetoothOn) return [];
    return await PrintBluetoothThermal.pairedBluetooths;
  }

  /// Hubungkan ke printer bluetooth berdasarkan MAC address
  Future<bool> connectPrinter(String macAddress) async {
    final bool result = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
    if (result) {
      _connectedMac = macAddress;
    }
    return result;
  }

  /// Putuskan koneksi
  Future<void> disconnect() async {
    await PrintBluetoothThermal.disconnect;
    _connectedMac = null;
  }

  /// Kirim sinyal buka laci kasir (Cash Drawer) secara manual
  Future<bool> openCashDrawer() async {
    return await _writeRawBytes(cashDrawerKickCommand);
  }

  Future<bool> _writeRawBytes(List<int> bytes) async {
    if (connectionType == PrinterConnectionType.network) {
      return await printViaNetwork(bytes);
    }
    return await PrintBluetoothThermal.writeBytes(bytes);
  }

  /// Kirim raw ESC/POS bytes langsung ke printer thermal LAN/WiFi (port default 9100)
  Future<bool> printViaNetwork(List<int> bytes, {String? ip, int? port}) async {
    final targetIp = (ip ?? networkIp).trim();
    final targetPort = port ?? networkPort;
    if (targetIp.isEmpty) return false;

    Socket? socket;
    try {
      socket = await Socket.connect(
        targetIp,
        targetPort,
        timeout: const Duration(seconds: 4),
      );
      socket.add(bytes);
      await socket.flush();
      return true;
    } catch (_) {
      return false;
    } finally {
      await socket?.close();
    }
  }

  /// Generate byte array struk ESC/POS (mendukung 58mm dan 80mm)
  Future<List<int>> generateReceipt({
    required SaleModel sale,
    ReceiptPaperSize? size,
    bool? kickCashDrawer,
    String storeName = 'TOKO BERKAH JAYA',
    String storeAddress = 'Jl. Pasar Tradisional No. 12',
    String storePhone = '0812-3456-7890',
  }) async {
    final activeSize = size ?? paperSize;
    final shouldKickDrawer = kickCashDrawer ?? autoOpenCashDrawer;
    final profile = await CapabilityProfile.load();
    final generator = Generator(activeSize.escPosSize, profile);
    List<int> bytes = [];

    // Header Toko
    bytes += generator.text(
      storeName,
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2),
    );
    bytes += generator.text(
      storeAddress,
      styles: const PosStyles(align: PosAlign.center, fontType: PosFontType.fontB),
    );
    bytes += generator.text(
      'Telp: $storePhone',
      styles: const PosStyles(align: PosAlign.center, fontType: PosFontType.fontB),
    );
    bytes += generator.hr(ch: '=');

    // Info Transaksi
    bytes += generator.row([
      PosColumn(text: 'No: ${sale.invoiceNo}', width: 7, styles: const PosStyles(fontType: PosFontType.fontB)),
      PosColumn(
        text: DateFormatter.formatShortDateTime(sale.date),
        width: 5,
        styles: const PosStyles(align: PosAlign.right, fontType: PosFontType.fontB),
      ),
    ]);
    bytes += generator.text('Pelanggan: ${sale.customerName}', styles: const PosStyles(fontType: PosFontType.fontB));
    bytes += generator.hr();

    // Rincian Item Barang
    for (final item in sale.items) {
      bytes += generator.text(item.productName, styles: const PosStyles(bold: true));
      bytes += generator.row([
        PosColumn(
          text: '${item.quantity} x ${CurrencyFormatter.formatNumber(item.sellingPrice)}',
          width: 7,
          styles: const PosStyles(fontType: PosFontType.fontB),
        ),
        PosColumn(
          text: CurrencyFormatter.formatNumber(item.subtotal),
          width: 5,
          styles: const PosStyles(align: PosAlign.right, fontType: PosFontType.fontB),
        ),
      ]);
    }

    bytes += generator.hr();

    // Rincian Total & Pembayaran
    bytes += generator.row([
      PosColumn(text: 'Total Belanja:', width: 6),
      PosColumn(
        text: CurrencyFormatter.formatRupiah(sale.finalAmount),
        width: 6,
        styles: const PosStyles(align: PosAlign.right, bold: true),
      ),
    ]);

    bytes += generator.row([
      PosColumn(text: 'Metode Bayar:', width: 6, styles: const PosStyles(fontType: PosFontType.fontB)),
      PosColumn(
        text: sale.paymentMethod.label,
        width: 6,
        styles: const PosStyles(align: PosAlign.right, fontType: PosFontType.fontB),
      ),
    ]);

    if (sale.paymentMethod == PaymentMethod.cash) {
      bytes += generator.row([
        PosColumn(text: 'Uang Diterima:', width: 6, styles: const PosStyles(fontType: PosFontType.fontB)),
        PosColumn(
          text: CurrencyFormatter.formatRupiah(sale.cashReceived),
          width: 6,
          styles: const PosStyles(align: PosAlign.right, fontType: PosFontType.fontB),
        ),
      ]);
      bytes += generator.row([
        PosColumn(text: 'Kembalian:', width: 6, styles: const PosStyles(bold: true)),
        PosColumn(
          text: CurrencyFormatter.formatRupiah(sale.changeAmount),
          width: 6,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);
    } else if (sale.paymentMethod == PaymentMethod.credit) {
      bytes += generator.row([
        PosColumn(text: 'Status:', width: 6, styles: const PosStyles(bold: true)),
        PosColumn(
          text: 'BELUM LUNAS (TEMPO)',
          width: 6,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);
      if (sale.dueDate != null) {
        bytes += generator.row([
          PosColumn(text: 'Jatuh Tempo:', width: 6, styles: const PosStyles(fontType: PosFontType.fontB)),
          PosColumn(
            text: DateFormatter.formatDateOnly(sale.dueDate!),
            width: 6,
            styles: const PosStyles(align: PosAlign.right, fontType: PosFontType.fontB),
          ),
        ]);
      }
    }

    bytes += generator.hr(ch: '=');
    bytes += generator.text(
      'Terima kasih atas kunjungan Anda!',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.text(
      'Barang yang dibeli tidak dapat ditukar',
      styles: const PosStyles(align: PosAlign.center, fontType: PosFontType.fontB),
    );
    bytes += generator.feed(2);
    bytes += generator.cut();

    if (shouldKickDrawer) {
      bytes += cashDrawerKickCommand;
    }

    return bytes;
  }

  /// Alias kompatibilitas 58mm
  Future<List<int>> generateReceipt58mm({
    required SaleModel sale,
    String storeName = 'TOKO BERKAH JAYA',
    String storeAddress = 'Jl. Pasar Tradisional No. 12',
    String storePhone = '0812-3456-7890',
  }) {
    return generateReceipt(
      sale: sale,
      size: ReceiptPaperSize.mm58,
      storeName: storeName,
      storeAddress: storeAddress,
      storePhone: storePhone,
    );
  }

  /// Eksekusi cetak langsung ke printer sesuai koneksi & ukuran kertas yang dipilih
  Future<bool> printSaleReceipt(SaleModel sale) async {
    final bytes = await generateReceipt(sale: sale);
    return await _writeRawBytes(bytes);
  }

  /// Cetak struk / invoice dokumen ke printer HVS / Apple AirPrint / Save as PDF
  Future<void> printSaleViaAirPrint(
    SaleModel sale, {
    String storeName = 'TOKO BERKAH JAYA',
    String storeAddress = 'Jl. Pasar Tradisional No. 12',
    String storePhone = '0812-3456-7890',
  }) async {
    await Printing.layoutPdf(
      name: 'Struk_${sale.invoiceNo}',
      onLayout: (PdfPageFormat format) async {
        final doc = pw.Document();
        doc.addPage(
          pw.Page(
            pageFormat: format,
            margin: const pw.EdgeInsets.all(32),
            build: (pw.Context context) {
              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Center(
                    child: pw.Column(
                      children: [
                        pw.Text(
                          storeName,
                          style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(storeAddress, style: const pw.TextStyle(fontSize: 11)),
                        pw.Text('Telp: $storePhone', style: const pw.TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 16),
                  pw.Divider(),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('No. Struk: ${sale.invoiceNo}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      pw.Text(DateFormatter.formatShortDateTime(sale.date)),
                    ],
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text('Pelanggan: ${sale.customerName}'),
                  pw.Text('Pembayaran: ${sale.paymentMethod.label}'),
                  pw.Divider(),
                  pw.SizedBox(height: 8),
                  pw.TableHelper.fromTextArray(
                    headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    cellAlignment: pw.Alignment.centerLeft,
                    headers: const ['Barang', 'Qty', 'Harga', 'Subtotal'],
                    data: sale.items.map((item) {
                      return [
                        item.productName,
                        '${item.quantity}',
                        CurrencyFormatter.formatRupiah(item.sellingPrice),
                        CurrencyFormatter.formatRupiah(item.subtotal),
                      ];
                    }).toList(),
                  ),
                  pw.SizedBox(height: 12),
                  pw.Divider(),
                  pw.Align(
                    alignment: pw.Alignment.centerRight,
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        if (sale.discount > 0)
                          pw.Text('Diskon: -${CurrencyFormatter.formatRupiah(sale.discount)}'),
                        pw.Text(
                          'TOTAL: ${CurrencyFormatter.formatRupiah(sale.finalAmount)}',
                          style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
                        ),
                        if (sale.paymentMethod == PaymentMethod.cash) ...[
                          pw.SizedBox(height: 4),
                          pw.Text('Bayar: ${CurrencyFormatter.formatRupiah(sale.cashReceived)}'),
                          if (sale.changeAmount > 0)
                            pw.Text('Kembalian: ${CurrencyFormatter.formatRupiah(sale.changeAmount)}'),
                        ],
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 24),
                  pw.Center(
                    child: pw.Text(
                      'Terima kasih atas kunjungan Anda!',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                  ),
                ],
              );
            },
          ),
        );
        return doc.save();
      },
    );
  }
}
