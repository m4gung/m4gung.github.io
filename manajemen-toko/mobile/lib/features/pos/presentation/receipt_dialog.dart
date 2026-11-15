import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/printer_service.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../models/sale_model.dart';

class ReceiptDialog extends StatefulWidget {
  final SaleModel sale;

  const ReceiptDialog({super.key, required this.sale});

  @override
  State<ReceiptDialog> createState() => _ReceiptDialogState();
}

class _ReceiptDialogState extends State<ReceiptDialog> {
  final GlobalKey _receiptBoundaryKey = GlobalKey();
  bool _isSharingImage = false;

  SaleModel get sale => widget.sale;

  String _buildWhatsAppMessage() {
    final sb = StringBuffer();
    sb.writeln('*STRUK BELANJA TOKO BERKAH JAYA*');
    sb.writeln('--------------------------------');
    sb.writeln('No. Faktur : ${sale.invoiceNo}');
    sb.writeln('Tanggal    : ${DateFormatter.formatShortDateTime(sale.date)}');
    sb.writeln('Pelanggan  : ${sale.customerName}');
    sb.writeln('--------------------------------');
    for (final item in sale.items) {
      sb.writeln(item.productName);
      sb.writeln('  ${item.quantity} x ${CurrencyFormatter.formatNumber(item.sellingPrice)} = ${CurrencyFormatter.formatRupiah(item.subtotal)}');
    }
    sb.writeln('--------------------------------');
    sb.writeln('*TOTAL      : ${CurrencyFormatter.formatRupiah(sale.finalAmount)}*');
    sb.writeln('Metode     : ${sale.paymentMethod.label}');
    if (sale.paymentMethod == PaymentMethod.cash) {
      sb.writeln('Uang Bayar : ${CurrencyFormatter.formatRupiah(sale.cashReceived)}');
      sb.writeln('Kembalian  : ${CurrencyFormatter.formatRupiah(sale.changeAmount)}');
    } else if (sale.paymentMethod == PaymentMethod.credit) {
      sb.writeln('Status     : BELUM LUNAS (TEMPO)');
      if (sale.dueDate != null) {
        sb.writeln('Jatuh Tempo: ${DateFormatter.formatDateOnly(sale.dueDate!)}');
      }
    }
    sb.writeln('--------------------------------');
    sb.writeln('Terima kasih telah berbelanja di toko kami!');
    return sb.toString();
  }

  Future<void> _shareWhatsApp(BuildContext context) async {
    final message = Uri.encodeComponent(_buildWhatsAppMessage());
    final url = Uri.parse('https://wa.me/?text=$message');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak dapat membuka WhatsApp')),
        );
      }
    }
  }

  Future<void> _shareReceiptImage(BuildContext context) async {
    setState(() => _isSharingImage = true);
    try {
      final boundary = _receiptBoundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;

      final pngBytes = byteData.buffer.asUint8List();
      final xFile = XFile.fromData(
        pngBytes,
        name: 'struk_${sale.invoiceNo}.png',
        mimeType: 'image/png',
      );
      await SharePlus.instance.share(
        ShareParams(
          files: [xFile],
          text: 'Struk Belanja ${sale.invoiceNo} - Toko Berkah Jaya',
        ),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal membagikan gambar struk: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSharingImage = false);
      }
    }
  }

  Future<void> _printBluetooth(BuildContext context) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    try {
      final success = await PrinterService.instance.printSaleReceipt(sale);
      if (success) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(content: Text('Struk berhasil dicetak!')),
        );
      } else {
        scaffoldMessenger.showSnackBar(
          const SnackBar(content: Text('Gagal mencetak. Pastikan printer Bluetooth terhubung di Pengaturan.')),
        );
      }
    } catch (e) {
      scaffoldMessenger.showSnackBar(
        SnackBar(content: Text('Error printer: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Area Struk yang bisa di-capture menjadi gambar PNG tajam untuk AirDrop / Photos / WA
              RepaintBoundary(
                key: _receiptBoundaryKey,
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircleAvatar(
                        radius: 28,
                        backgroundColor: Color(0xFFD1FAE5),
                        child: Icon(Icons.check_circle, color: Color(0xFF059669), size: 36),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Pembayaran Berhasil!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Faktur: ${sale.invoiceNo}',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      ),
                      const Divider(height: 20),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Belanja'),
                          Text(
                            CurrencyFormatter.formatRupiah(sale.finalAmount),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Metode'),
                          Text(sale.paymentMethod.label),
                        ],
                      ),
                      if (sale.paymentMethod == PaymentMethod.cash) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Uang Diterima'),
                            Text(CurrencyFormatter.formatRupiah(sale.cashReceived)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Kembalian', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text(
                              CurrencyFormatter.formatRupiah(sale.changeAmount),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Tombol Cetak Struk Thermal
              ElevatedButton.icon(
                onPressed: () => _printBluetooth(context),
                icon: const Icon(Icons.print),
                label: Text(
                  'Cetak Struk Thermal (${PrinterService.instance.paperSize == ReceiptPaperSize.mm80 ? '80mm' : '58mm'})',
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 8),

              // Tombol Cetak Apple AirPrint / PDF (iPad & iOS)
              OutlinedButton.icon(
                onPressed: () => PrinterService.instance.printSaleViaAirPrint(sale),
                icon: const Icon(Icons.picture_as_pdf, color: Color(0xFF0F172A)),
                label: const Text('Cetak Dokumen (AirPrint / PDF)', style: TextStyle(color: Color(0xFF0F172A))),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 8),

              // Tombol Kirim WhatsApp (Teks)
              OutlinedButton.icon(
                onPressed: () => _shareWhatsApp(context),
                icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                label: const Text('Kirim Struk via WhatsApp', style: TextStyle(color: Color(0xFF0F172A))),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 8),

              // Tombol Bagikan / Simpan Gambar Struk (AirDrop, Photos, iMessage)
              OutlinedButton.icon(
                onPressed: _isSharingImage ? null : () => _shareReceiptImage(context),
                icon: const Icon(Icons.ios_share, color: Color(0xFF2563EB)),
                label: Text(
                  _isSharingImage ? 'Menyiapkan Gambar...' : 'Simpan / Bagikan Gambar Struk',
                  style: const TextStyle(color: Color(0xFF0F172A)),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),

              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Transaksi Baru', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
