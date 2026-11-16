import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:toko_pos/core/database/app_database.dart';
import 'package:toko_pos/core/services/google_sheets_sync_service.dart';
import 'package:toko_pos/core/services/printer_service.dart';
import 'package:toko_pos/core/services/report_export_service.dart';
import 'package:toko_pos/core/utils/currency_formatter.dart';
import 'package:toko_pos/core/widgets/adaptive_layout.dart';
import 'package:toko_pos/features/pos/controllers/pos_controller.dart';
import 'package:toko_pos/features/pos/presentation/qris_display_widget.dart';
import 'package:toko_pos/features/pos/presentation/receipt_dialog.dart';
import 'package:toko_pos/main.dart';
import 'package:toko_pos/models/cash_movement_model.dart';
import 'package:toko_pos/models/product_model.dart';
import 'package:toko_pos/models/customer_model.dart';
import 'package:toko_pos/models/sale_model.dart';

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  group('UMKM CurrencyFormatter Unit Tests', () {
    test('Format Rupiah separator ribuan', () {
      expect(CurrencyFormatter.formatRupiah(15000), 'Rp 15.000');
      expect(CurrencyFormatter.formatRupiah(1250000), 'Rp 1.250.000');
      expect(CurrencyFormatter.formatNumber(50000), '50.000');
    });

    test('Parse clean text string ribuan ke integer', () {
      expect(CurrencyFormatter.parseClean('15.000'), 15000);
      expect(CurrencyFormatter.parseClean('Rp 1.500.000'), 1500000);
      expect(CurrencyFormatter.parseClean(''), 0);
    });
  });

  group('POS Cart Logic & Margin Tests', () {
    final sampleProduct1 = ProductModel(
      id: 'p1',
      name: 'Beras 5kg',
      costPrice: 60000,
      sellingPrice: 70000,
      stock: 10,
      updatedAt: DateTime.now(),
    );

    final sampleProduct2 = ProductModel(
      id: 'p2',
      name: 'Minyak Goreng',
      costPrice: 30000,
      sellingPrice: 35000,
      stock: 20,
      updatedAt: DateTime.now(),
    );

    test('Perhitungan Subtotal, Total, dan Diskon Keranjang', () {
      final cart = {
        'p1': CartItem(product: sampleProduct1, quantity: 2), // 140.000
        'p2': CartItem(product: sampleProduct2, quantity: 1), // 35.000
      };

      final state = PosState(items: cart, discount: 5000);

      expect(state.totalItemCount, 3);
      expect(state.totalAmount, 175000);
      expect(state.finalAmount, 170000);
    });

    test('Validasi Limit Hutang Pelanggan', () {
      final customer = CustomerModel(
        id: 'c1',
        name: 'Pak RT',
        creditLimit: 500000,
        currentDebt: 450000,
        updatedAt: DateTime.now(),
      );

      expect(customer.remainingCredit, 50000);
      expect(customer.isOverLimit, false);

      final overCustomer = customer.copyWith(currentDebt: 550000);
      expect(overCustomer.isOverLimit, true);
    });
  });

  group('Fase 2: Tablet Adaptive Layout & Printer 80mm Tests', () {
    test('AdaptiveLayout grid columns calculation', () {
      expect(AdaptiveLayout.catalogGridColumns(400), 2);
      expect(AdaptiveLayout.catalogGridColumns(600), 3);
      expect(AdaptiveLayout.catalogGridColumns(900), 4);
    });

    test('PrinterService 80mm & Cash Drawer ESC/POS command', () {
      expect(PrinterService.cashDrawerKickCommand, [0x1B, 0x70, 0x00, 0x19, 0xFA]);
      expect(ReceiptPaperSize.mm80.label, contains('80mm'));
    });

    testWidgets('Tablet Dual-Pane POS Render Test (>= 600dp)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: TokoPosApp(),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Mode Tablet harus menampilkan NavigationRail dan Keranjang Kasir statis
      expect(find.byType(NavigationRail), findsOneWidget);
      expect(find.text('Keranjang Kasir'), findsOneWidget);
      expect(find.text('Kasir Meja POS (Mode Tablet)'), findsOneWidget);
    });
  });

  testWidgets('Toko POS App Smoke Render Test (Mobile Phone)', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(400, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const ProviderScope(
        child: TokoPosApp(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    // Pastikan Tab Kasir muncul di NavigationBar HP
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Kasir'), findsWidgets);
    expect(find.text('Produk'), findsWidgets);
    expect(find.text('Hutang'), findsWidgets);
    expect(find.text('Buku Kas'), findsWidgets);
  });

  group('Fase 3: iOS QRIS & Share Receipt Tests', () {
    testWidgets('QrisDisplayWidget renders QRIS amount and store name', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: QrisDisplayWidget(amount: 75000),
          ),
        ),
      );
      expect(find.textContaining('QRIS • TOKO BERKAH JAYA'), findsOneWidget);
      expect(find.textContaining('Rp 75.000'), findsOneWidget);
    });

    testWidgets('ReceiptDialog displays thermal print, WhatsApp, and Share Image options', (WidgetTester tester) async {
      final sampleSale = SaleModel(
        invoiceNo: 'INV-20261115-0001',
        date: DateTime(2026, 11, 15, 10, 30),
        totalAmount: 50000,
        finalAmount: 50000,
        paymentMethod: PaymentMethod.cash,
        cashReceived: 100000,
        changeAmount: 50000,
        paymentStatus: 'PAID',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReceiptDialog(sale: sampleSale),
          ),
        ),
      );

      expect(find.text('Pembayaran Berhasil!'), findsOneWidget);
      expect(find.text('Kirim Struk via WhatsApp'), findsOneWidget);
      expect(find.text('Simpan / Bagikan Gambar Struk'), findsOneWidget);
      expect(find.text('Cetak Dokumen (AirPrint / PDF)'), findsOneWidget);
    });

    test('AdaptiveLayout scales up to 5-6 columns on wide iPad Pro screens', () {
      expect(AdaptiveLayout.catalogGridColumns(740), 4);
      expect(AdaptiveLayout.catalogGridColumns(1000), 5);
      expect(AdaptiveLayout.catalogGridColumns(1200), 6);
    });

    test('PrinterService supports WiFi / LAN connection mode & port 9100', () async {
      final printer = PrinterService.instance;
      printer.connectionType = PrinterConnectionType.network;
      printer.networkIp = '192.168.1.100';
      printer.networkPort = 9100;

      expect(printer.isConnected, true);
      expect(printer.networkPort, 9100);

      // Reset to default bluetooth mode
      printer.connectionType = PrinterConnectionType.bluetooth;
      printer.networkIp = '';
      expect(await printer.printViaNetwork([0x1B, 0x40], ip: ''), false);
    });
  });

  group('Fase 5: Backup, Google Sheets Sync, CSV & Offline Hardening Tests', () {
    test('GoogleSheetsSyncService validates Apps Script Web App URL', () {
      final sync = GoogleSheetsSyncService.instance;
      expect(sync.isValidWebAppUrl('https://script.google.com/macros/s/abc123/exec'), true);
      expect(sync.isValidWebAppUrl('http://example.com/api'), false);
      expect(sync.isValidWebAppUrl(''), false);
    });

    test('ReportExportService generates UTF-8 BOM CSV with escaped values', () {
      final csv = ReportExportService.instance.generateSalesCsv([
        {
          'invoice_no': 'INV-20261115-0001',
          'date': DateTime(2026, 11, 15, 10, 30).toIso8601String(),
          'customer_name': 'Ibu Siti "Warung"',
          'payment_method': 'cash',
          'payment_status': 'paid',
          'total_amount': 25000,
          'discount': 0,
          'final_amount': 25000,
          'items': [
            {'product_name': 'Beras 5kg', 'quantity': 1},
          ],
        },
      ]);

      expect(csv.startsWith('\uFEFF'), true);
      expect(csv.contains('INV-20261115-0001'), true);
      expect(csv.contains('"Ibu Siti ""Warung"""'), true);
      expect(csv.contains('Beras 5kg x1'), true);
    });

    test('Offline Hardening: 50 transactions, Backup JSON & Restore roundtrip without data loss', () async {
      final db = AppDatabase.instance;
      await db.initInMemoryForTest();
      final products = await db.getProducts();
      expect(products.isNotEmpty, true);
      final targetProduct = products.first;

      final now = DateTime.now();
      for (int i = 1; i <= 50; i++) {
        final sale = SaleModel(
          invoiceNo: 'INV-OFFLINE-50-${i.toString().padLeft(3, '0')}',
          date: now,
          customerName: 'Pelanggan Offline $i',
          totalAmount: targetProduct.sellingPrice,
          discount: 0,
          finalAmount: targetProduct.sellingPrice,
          paymentMethod: PaymentMethod.cash,
          cashReceived: targetProduct.sellingPrice,
          changeAmount: 0,
          paymentStatus: 'paid',
          items: [
            SaleItemModel(
              id: 'item-offline-$i',
              invoiceNo: 'INV-OFFLINE-50-${i.toString().padLeft(3, '0')}',
              productId: targetProduct.id,
              productName: targetProduct.name,
              costPrice: targetProduct.costPrice,
              sellingPrice: targetProduct.sellingPrice,
              quantity: 1,
              subtotal: targetProduct.sellingPrice,
            ),
          ],
        );
        await db.saveTransaction(sale);
      }

      final startOfDay = DateTime(now.year, now.month, now.day);
      final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);
      final report = await db.getSalesReport(start: startOfDay, end: endOfDay);
      expect((report['transactionCount'] as int) >= 50, true);
      expect((report['totalRevenue'] as int) >= targetProduct.sellingPrice * 50, true);

      // Export & Restore roundtrip
      final backup = await db.exportFullBackupData();
      expect((backup['tables']['sales'] as List).length >= 50, true);
      await db.restoreFullBackupData(backup);
      final restoredReport = await db.getSalesReport(start: startOfDay, end: endOfDay);
      expect(restoredReport['transactionCount'], report['transactionCount']);
    });

    test('ReportExportService generates cashbook journal CSV and products CSV', () {
      final journalCsv = ReportExportService.instance.generateCashbookCsv([
        CashMovementModel(
          id: 'cm-1',
          date: DateTime(2026, 11, 15, 9, 0),
          type: CashType.expense,
          amount: 50000,
          category: 'Bayar Listrik',
          notes: 'Token PLN',
          refNo: 'REF-01',
        ),
      ]);
      expect(journalCsv.startsWith('\uFEFF'), true);
      expect(journalCsv.contains('Uang Keluar'), true);
      expect(journalCsv.contains('Bayar Listrik'), true);
      expect(journalCsv.contains('50000'), true);

      final prodCsv = ReportExportService.instance.generateProductsCsv([
        ProductModel(
          id: 'p-1',
          sku: 'SKU01',
          barcode: '89912345',
          name: 'Minyak Goreng 1L',
          category: 'Sembako',
          unit: 'pcs',
          costPrice: 14000,
          sellingPrice: 16500,
          stock: 12,
          minStock: 3,
          updatedAt: DateTime(2026, 11, 15),
        ),
      ]);
      expect(prodCsv.startsWith('\uFEFF'), true);
      expect(prodCsv.contains('SKU01'), true);
      expect(prodCsv.contains('Minyak Goreng 1L'), true);
      expect(prodCsv.contains('16500'), true);
    });

    test('AppDatabase upsertCustomer allows 0 creditLimit and clearAllData resets all tables', () async {
      final db = AppDatabase.instance;
      await db.initInMemoryForTest();

      final c = CustomerModel(
        id: 'cust-zero-limit',
        name: 'Pak Budi',
        phone: '0812345',
        creditLimit: 0,
        currentDebt: 0,
        updatedAt: DateTime.now(),
      );
      await db.upsertCustomer(c);
      final customers = await db.getCustomers();
      final saved = customers.firstWhere((item) => item.id == 'cust-zero-limit');
      expect(saved.creditLimit, 0);

      // Edit customer
      await db.upsertCustomer(saved.copyWith(name: 'Pak Budi Updated', creditLimit: 250000));
      final updatedCustomers = await db.getCustomers();
      final edited = updatedCustomers.firstWhere((item) => item.id == 'cust-zero-limit');
      expect(edited.name, 'Pak Budi Updated');
      expect(edited.creditLimit, 250000);

      // Clear all data (Reset Toko)
      await db.setSetting('gas_webapp_url', 'https://example.com/exec');
      await db.clearAllData();
      expect(await db.getProducts(), isEmpty);
      expect(await db.getCustomers(), isEmpty);
      expect(await db.getCategories(), isEmpty);
      expect(await db.getCashMovements(), isEmpty);
      expect(await db.getSalesHistoryWithItems(), isEmpty);
      expect(await db.getSetting('gas_webapp_url'), isNull);
    });
  });
}
