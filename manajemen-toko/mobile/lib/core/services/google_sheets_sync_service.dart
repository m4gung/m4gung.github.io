import 'dart:convert';
import 'dart:io';

import '../database/app_database.dart';

class GoogleSheetsSyncResult {
  final int syncedCount;
  final int failedCount;
  final String message;

  const GoogleSheetsSyncResult({
    required this.syncedCount,
    required this.failedCount,
    required this.message,
  });
}

class GoogleSheetsSyncService {
  static final GoogleSheetsSyncService instance = GoogleSheetsSyncService._init();
  GoogleSheetsSyncService._init();

  static const String _settingsUrlKey = 'gas_webapp_url';
  static const String _settingsLastSyncKey = 'gas_last_sync_at';

  bool isValidWebAppUrl(String url) {
    final trimmed = url.trim();
    return trimmed.startsWith('https://script.google.com/') && trimmed.isNotEmpty;
  }

  Future<String> getSavedWebAppUrl() async {
    return (await AppDatabase.instance.getSetting(_settingsUrlKey)) ?? '';
  }

  Future<void> saveWebAppUrl(String url) async {
    await AppDatabase.instance.setSetting(_settingsUrlKey, url.trim());
  }

  Future<String?> getLastSyncAt() async {
    return await AppDatabase.instance.getSetting(_settingsLastSyncKey);
  }

  /// Tes koneksi ke Google Apps Script Web App (`?action=ping`)
  Future<bool> testConnection(String webAppUrl) async {
    if (!isValidWebAppUrl(webAppUrl)) return false;

    final uri = Uri.parse(webAppUrl.trim()).replace(queryParameters: {'action': 'ping'});
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 8);
    try {
      final request = await client.getUrl(uri);
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode >= 200 && response.statusCode < 400) {
        final decoded = jsonDecode(body);
        return decoded is Map && decoded['success'] == true;
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }

  /// Kirim transaksi hari ini ke Google Sheets menggunakan endpoint `checkoutSale` pada Code.gs
  Future<GoogleSheetsSyncResult> syncTodaySalesToSheets(String webAppUrl) async {
    if (!isValidWebAppUrl(webAppUrl)) {
      return const GoogleSheetsSyncResult(
        syncedCount: 0,
        failedCount: 0,
        message: 'URL Google Apps Script tidak valid (harus diawali https://script.google.com/).',
      );
    }

    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);

    final sales = await AppDatabase.instance.getSalesWithItemsForExport(
      start: startOfDay,
      end: endOfDay,
    );

    if (sales.isEmpty) {
      return const GoogleSheetsSyncResult(
        syncedCount: 0,
        failedCount: 0,
        message: 'Belum ada transaksi hari ini untuk disinkronkan.',
      );
    }

    int synced = 0;
    int failed = 0;
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 10);

    try {
      final uri = Uri.parse(webAppUrl.trim());
      for (final sale in sales) {
        final items = (sale['items'] as List<dynamic>? ?? []).map((rawItem) {
          final item = rawItem as Map<String, dynamic>;
          return {
            'productId': item['product_id'],
            'productName': item['product_name'],
            'costPrice': item['cost_price'],
            'sellingPrice': item['selling_price'],
            'quantity': item['quantity'],
            'subtotal': item['subtotal'],
          };
        }).toList();

        final payload = {
          'action': 'checkoutSale',
          'payload': {
            'invoiceNo': sale['invoice_no'],
            'date': sale['date'],
            'customerName': sale['customer_name'],
            'customerId': sale['customer_id'],
            'totalAmount': sale['total_amount'],
            'discount': sale['discount'],
            'finalAmount': sale['final_amount'],
            'paymentMethod': sale['payment_method'],
            'cashReceived': sale['cash_received'],
            'changeAmount': sale['change_amount'],
            'paymentStatus': sale['payment_status'],
            'dueDate': sale['due_date'],
            'items': items,
          },
        };

        try {
          final request = await client.postUrl(uri);
          request.headers.contentType = ContentType.json;
          request.write(jsonEncode(payload));
          final response = await request.close();
          await response.drain<void>();
          if (response.statusCode >= 200 && response.statusCode < 400) {
            synced++;
          } else {
            failed++;
          }
        } catch (_) {
          failed++;
        }
      }
    } finally {
      client.close(force: true);
    }

    if (synced > 0) {
      await AppDatabase.instance.setSetting(_settingsLastSyncKey, DateTime.now().toIso8601String());
    }

    return GoogleSheetsSyncResult(
      syncedCount: synced,
      failedCount: failed,
      message: failed == 0
          ? '$synced transaksi hari ini berhasil dikirim ke Google Sheets!'
          : '$synced berhasil dikirim, $failed gagal terkirim.',
    );
  }
}
