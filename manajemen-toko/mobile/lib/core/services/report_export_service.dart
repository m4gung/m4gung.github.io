import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../database/app_database.dart';
import '../utils/currency_formatter.dart';
import '../utils/date_formatter.dart';

class ReportExportService {
  static final ReportExportService instance = ReportExportService._init();
  ReportExportService._init();

  /// Bangun konten CSV (dengan UTF-8 BOM agar Excel langsung membaca format angka & huruf Indonesia)
  String generateSalesCsv(List<Map<String, dynamic>> sales) {
    final buffer = StringBuffer('\uFEFF');
    buffer.writeln('No Struk,Tanggal,Pelanggan,Metode Bayar,Status,Total Belanja,Diskon,Total Akhir,Rincian Barang');

    for (final sale in sales) {
      final items = (sale['items'] as List<dynamic>? ?? [])
          .map((e) => '${e['product_name']} x${e['quantity']}')
          .join(' | ');
      final dateStr = DateFormatter.formatShortDateTime(
        DateTime.tryParse(sale['date']?.toString() ?? '') ?? DateTime.now(),
      );
      buffer.writeln(
        '${_csvEscape(sale['invoice_no'])},'
        '${_csvEscape(dateStr)},'
        '${_csvEscape(sale['customer_name'])},'
        '${_csvEscape(sale['payment_method'])},'
        '${_csvEscape(sale['payment_status'])},'
        '${sale['total_amount']},'
        '${sale['discount']},'
        '${sale['final_amount']},'
        '${_csvEscape(items)}',
      );
    }
    return buffer.toString();
  }

  String _csvEscape(Object? value) {
    final str = (value ?? '').toString().replaceAll('"', '""');
    return '"$str"';
  }

  /// Ekspor laporan penjualan ke file .csv dan bagikan ke Excel / WhatsApp / Google Drive
  Future<void> exportAndShareSalesCsv({
    required DateTime start,
    required DateTime end,
    required String periodLabel,
  }) async {
    final sales = await AppDatabase.instance.getSalesWithItemsForExport(start: start, end: end);
    final csvContent = generateSalesCsv(sales);
    final dir = await getTemporaryDirectory();
    final safeLabel = periodLabel.toLowerCase().replaceAll(' ', '_');
    final file = File('${dir.path}/laporan_kasirku_$safeLabel.csv');
    await file.writeAsString(csvContent, flush: true);

    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: 'text/csv')],
        text: 'Laporan Penjualan Kasirku ($periodLabel)',
      ),
    );
  }

  /// Cetak / simpan PDF rangkuman laporan keuangan harian atau bulanan
  Future<void> printFinancialSummaryPdf({
    required String periodLabel,
    required Map<String, dynamic> report,
    required Map<String, int> cashSummary,
    String storeName = 'TOKO BERKAH JAYA',
  }) async {
    final topProducts = (report['topProducts'] as List<dynamic>? ?? []);

    await Printing.layoutPdf(
      name: 'Laporan_Kasirku_${periodLabel.replaceAll(' ', '_')}',
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
                  pw.Text(
                    storeName,
                    style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text('Laporan Keuangan & Penjualan ($periodLabel)'),
                  pw.Text('Dicetak: ${DateFormatter.formatShortDateTime(DateTime.now())}'),
                  pw.SizedBox(height: 12),
                  pw.Divider(),
                  pw.SizedBox(height: 8),
                  pw.Text('Ringkasan Penjualan', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 6),
                  pw.Bullet(text: 'Jumlah Transaksi: ${report['transactionCount'] ?? 0}'),
                  pw.Bullet(text: 'Omzet Kotor: ${CurrencyFormatter.formatRupiah(report['totalRevenue'] as int? ?? 0)}'),
                  pw.Bullet(text: 'Keuntungan Bersih (Estimasi): ${CurrencyFormatter.formatRupiah(report['netProfit'] as int? ?? 0)}'),
                  pw.SizedBox(height: 12),
                  pw.Text('Ringkasan Buku Kas Hari Ini', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 6),
                  pw.Bullet(text: 'Uang Masuk: ${CurrencyFormatter.formatRupiah(cashSummary['income'] ?? 0)}'),
                  pw.Bullet(text: 'Uang Keluar: ${CurrencyFormatter.formatRupiah(cashSummary['expense'] ?? 0)}'),
                  pw.Bullet(text: 'Saldo Bersih: ${CurrencyFormatter.formatRupiah(cashSummary['balance'] ?? 0)}'),
                  pw.SizedBox(height: 16),
                  pw.Text('Barang Paling Laris', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 8),
                  if (topProducts.isEmpty)
                    pw.Text('Belum ada data penjualan pada periode ini.')
                  else
                    pw.TableHelper.fromTextArray(
                      headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200),
                      headers: const ['Nama Barang', 'Terjual', 'Total Omzet'],
                      data: topProducts.map((p) {
                        final row = p as Map<String, dynamic>;
                        return [
                          row['product_name'].toString(),
                          '${row['total_qty']} pcs',
                          CurrencyFormatter.formatRupiah((row['total_revenue'] as num?)?.toInt() ?? 0),
                        ];
                      }).toList(),
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
