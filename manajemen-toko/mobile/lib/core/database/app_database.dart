import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import '../../models/category_model.dart';
import '../../models/product_model.dart';
import '../../models/customer_model.dart';
import '../../models/sale_model.dart';
import '../../models/cash_movement_model.dart';

class AppDatabase {
  static final AppDatabase instance = AppDatabase._init();
  static Database? _database;

  AppDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('toko_pos.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  /// Inisialisasi database in-memory untuk keperluan unit test
  Future<void> initInMemoryForTest() async {
    _database = await openDatabase(
      inMemoryDatabasePath,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // 1. Tabel Kategori
    await db.execute('''
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    ''');

    // 2. Tabel Produk
    await db.execute('''
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        sku TEXT,
        barcode TEXT,
        name TEXT NOT NULL,
        category TEXT,
        unit TEXT,
        cost_price INTEGER NOT NULL,
        selling_price INTEGER NOT NULL,
        stock INTEGER NOT NULL,
        min_stock INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    // 3. Tabel Pelanggan
    await db.execute('''
      CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        credit_limit INTEGER NOT NULL,
        current_debt INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    // 4. Tabel Penjualan (Header)
    await db.execute('''
      CREATE TABLE sales (
        invoice_no TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_id TEXT,
        total_amount INTEGER NOT NULL,
        discount INTEGER NOT NULL,
        final_amount INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        cash_received INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        payment_status TEXT NOT NULL,
        due_date TEXT
      )
    ''');

    // 5. Tabel Item Penjualan (Detail)
    await db.execute('''
      CREATE TABLE sale_items (
        id TEXT PRIMARY KEY,
        invoice_no TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        cost_price INTEGER NOT NULL,
        selling_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        FOREIGN KEY (invoice_no) REFERENCES sales (invoice_no) ON DELETE CASCADE
      )
    ''');

    // 6. Tabel Mutasi Kas (Uang Masuk / Keluar)
    await db.execute('''
      CREATE TABLE cash_movements (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        ref_no TEXT
      )
    ''');

    // Seed Data Awal untuk UMKM
    await _insertInitialSeedData(db);
  }

  Future<void> _insertInitialSeedData(Database db) async {
    const uuid = Uuid();
    final now = DateTime.now().toIso8601String();

    // Kategori
    final categories = ['Makanan', 'Minuman', 'Sembako', 'Rokok', 'Lainnya'];
    for (final cat in categories) {
      await db.insert('categories', {'id': uuid.v4(), 'name': cat});
    }

    // Produk Sampel Toko
    final sampleProducts = [
      {
        'id': uuid.v4(),
        'sku': 'SM-001',
        'barcode': '899999900001',
        'name': 'Beras Ramos 5kg',
        'category': 'Sembako',
        'unit': 'sak',
        'cost_price': 65000,
        'selling_price': 72000,
        'stock': 25,
        'min_stock': 5,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'sku': 'SM-002',
        'barcode': '899999900002',
        'name': 'Minyak Goreng 2L',
        'category': 'Sembako',
        'unit': 'pouch',
        'cost_price': 32000,
        'selling_price': 36000,
        'stock': 40,
        'min_stock': 8,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'sku': 'MN-001',
        'barcode': '899999900003',
        'name': 'Kopi Kapal Api Spesial 65g',
        'category': 'Minuman',
        'unit': 'bks',
        'cost_price': 6500,
        'selling_price': 8000,
        'stock': 50,
        'min_stock': 10,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'sku': 'MK-001',
        'barcode': '899999900004',
        'name': 'Indomie Goreng Spesial',
        'category': 'Makanan',
        'unit': 'bks',
        'cost_price': 2800,
        'selling_price': 3500,
        'stock': 85,
        'min_stock': 20,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'sku': 'MN-002',
        'barcode': '899999900005',
        'name': 'Teh Pucuk Harum 350ml',
        'category': 'Minuman',
        'unit': 'btl',
        'cost_price': 3000,
        'selling_price': 4000,
        'stock': 36,
        'min_stock': 12,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'sku': 'SM-003',
        'barcode': '899999900006',
        'name': 'Gula Pasir Gulaku 1kg',
        'category': 'Sembako',
        'unit': 'kg',
        'cost_price': 16000,
        'selling_price': 18500,
        'stock': 30,
        'min_stock': 5,
        'updated_at': now,
      },
    ];

    for (final prod in sampleProducts) {
      await db.insert('products', prod);
    }

    // Pelanggan Awal
    final sampleCustomers = [
      {
        'id': uuid.v4(),
        'name': 'Pak Budi (Tetangga Depan)',
        'phone': '081234567890',
        'address': 'Rumah No. 14',
        'credit_limit': 500000,
        'current_debt': 0,
        'updated_at': now,
      },
      {
        'id': uuid.v4(),
        'name': 'Bu Siti (Warung Sebelah)',
        'phone': '081398765432',
        'address': 'Gang Melati',
        'credit_limit': 1000000,
        'current_debt': 150000,
        'updated_at': now,
      },
    ];

    for (final cust in sampleCustomers) {
      await db.insert('customers', cust);
    }

    // Modal Kas Awal
    await db.insert('cash_movements', {
      'id': uuid.v4(),
      'date': now,
      'type': 'income',
      'amount': 250000,
      'category': 'Modal Kasir Awal',
      'notes': 'Pecahan uang kembalian di laci kasir',
      'ref_no': null,
    });
  }

  // ================= CRUD PRODUK =================
  Future<List<ProductModel>> getProducts({String query = '', String? category}) async {
    final db = await instance.database;
    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (query.isNotEmpty) {
      whereClause += '(name LIKE ? OR barcode LIKE ? OR sku LIKE ?)';
      whereArgs.addAll(['%$query%', '%$query%', '%$query%']);
    }

    if (category != null && category != 'Semua') {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += 'category = ?';
      whereArgs.add(category);
    }

    final maps = await db.query(
      'products',
      where: whereClause.isNotEmpty ? whereClause : null,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'name ASC',
    );

    return maps.map((m) => ProductModel.fromMap(m)).toList();
  }

  Future<ProductModel?> getProductByBarcode(String barcode) async {
    final db = await instance.database;
    final maps = await db.query(
      'products',
      where: 'barcode = ? OR sku = ?',
      whereArgs: [barcode, barcode],
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return ProductModel.fromMap(maps.first);
  }

  Future<void> insertProduct(ProductModel product) async {
    final db = await instance.database;
    await db.insert('products', product.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateProduct(ProductModel product) async {
    final db = await instance.database;
    await db.update('products', product.toMap(), where: 'id = ?', whereArgs: [product.id]);
  }

  Future<void> deleteProduct(String id) async {
    final db = await instance.database;
    await db.delete('products', where: 'id = ?', whereArgs: [id]);
  }

  // ================= CRUD KATEGORI =================
  Future<List<CategoryModel>> getCategories() async {
    final db = await instance.database;
    final maps = await db.query('categories', orderBy: 'name ASC');
    return maps.map((m) => CategoryModel.fromMap(m)).toList();
  }

  Future<void> insertCategory(String name) async {
    final db = await instance.database;
    await db.insert('categories', {'id': const Uuid().v4(), 'name': name});
  }

  // ================= CRUD PELANGGAN =================
  Future<List<CustomerModel>> getCustomers() async {
    final db = await instance.database;
    final maps = await db.query('customers', orderBy: 'name ASC');
    return maps.map((m) => CustomerModel.fromMap(m)).toList();
  }

  Future<void> updateCustomerDebt(String customerId, int deltaDebt) async {
    final db = await instance.database;
    await db.rawUpdate('''
      UPDATE customers 
      SET current_debt = current_debt + ?, updated_at = ?
      WHERE id = ?
    ''', [deltaDebt, DateTime.now().toIso8601String(), customerId]);
  }

  Future<void> upsertCustomer(CustomerModel customer) async {
    final db = await instance.database;
    await db.insert(
      'customers',
      customer.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Ambil seluruh riwayat penjualan beserta item barangnya
  Future<List<SaleModel>> getSalesHistoryWithItems() async {
    final db = await instance.database;
    final salesRows = await db.query('sales', orderBy: 'date DESC');
    final List<SaleModel> result = [];
    for (final row in salesRows) {
      final itemRows = await db.query(
        'sale_items',
        where: 'invoice_no = ?',
        whereArgs: [row['invoice_no']],
      );
      final items = itemRows.map((im) {
        return SaleItemModel(
          id: im['id'] as String,
          invoiceNo: im['invoice_no'] as String,
          productId: im['product_id'] as String,
          productName: im['product_name'] as String,
          costPrice: (im['cost_price'] as num).toInt(),
          sellingPrice: (im['selling_price'] as num).toInt(),
          quantity: (im['quantity'] as num).toInt(),
          subtotal: (im['subtotal'] as num).toInt(),
        );
      }).toList();

      final methodStr = row['payment_method'] as String? ?? 'cash';
      final method = PaymentMethod.values.firstWhere(
        (m) => m.name == methodStr,
        orElse: () => PaymentMethod.cash,
      );

      result.add(
        SaleModel(
          invoiceNo: row['invoice_no'] as String,
          date: DateTime.tryParse(row['date'] as String? ?? '') ?? DateTime.now(),
          customerName: row['customer_name'] as String? ?? 'Pelanggan Umum',
          customerId: row['customer_id'] as String?,
          totalAmount: (row['total_amount'] as num).toInt(),
          discount: (row['discount'] as num).toInt(),
          finalAmount: (row['final_amount'] as num).toInt(),
          paymentMethod: method,
          cashReceived: (row['cash_received'] as num).toInt(),
          changeAmount: (row['change_amount'] as num).toInt(),
          paymentStatus: row['payment_status'] as String? ?? 'paid',
          dueDate: row['due_date'] != null ? DateTime.tryParse(row['due_date'] as String) : null,
          items: items,
        ),
      );
    }
    return result;
  }

  /// Edit transaksi secara atomik: kembalikan stok/hutang/kas lama lalu terapkan data baru
  Future<void> updateTransaction(SaleModel updatedSale) async {
    final db = await instance.database;
    final nowIso = DateTime.now().toIso8601String();

    await db.transaction((txn) async {
      final oldSales = await txn.query(
        'sales',
        where: 'invoice_no = ?',
        whereArgs: [updatedSale.invoiceNo],
        limit: 1,
      );
      if (oldSales.isEmpty) {
        throw Exception('Transaksi ${updatedSale.invoiceNo} tidak ditemukan.');
      }
      final oldSale = oldSales.first;

      // 1. Kembalikan stok lama
      final oldItems = await txn.query(
        'sale_items',
        where: 'invoice_no = ?',
        whereArgs: [updatedSale.invoiceNo],
      );
      for (final oldIt in oldItems) {
        await txn.rawUpdate('''
          UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?
        ''', [(oldIt['quantity'] as num).toInt(), nowIso, oldIt['product_id']]);
      }

      // 2. Kembalikan hutang pelanggan lama jika sebelumnya kredit
      if (oldSale['payment_method'] == PaymentMethod.credit.name && oldSale['customer_id'] != null) {
        await txn.rawUpdate('''
          UPDATE customers
          SET current_debt = MAX(0, current_debt - ?), updated_at = ?
          WHERE id = ?
        ''', [(oldSale['final_amount'] as num).toInt(), nowIso, oldSale['customer_id']]);
      }

      // 3. Hapus sale_items & mutasi kas lama terkait invoice
      await txn.delete('sale_items', where: 'invoice_no = ?', whereArgs: [updatedSale.invoiceNo]);
      await txn.delete('cash_movements', where: 'ref_no = ?', whereArgs: [updatedSale.invoiceNo]);

      // 4. Perbarui header sales
      await txn.update(
        'sales',
        updatedSale.toMap(),
        where: 'invoice_no = ?',
        whereArgs: [updatedSale.invoiceNo],
      );

      // 5. Simpan item baru & potong stok baru
      for (final item in updatedSale.items) {
        await txn.insert('sale_items', item.toMap());
        await txn.rawUpdate('''
          UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?
        ''', [item.quantity, nowIso, item.productId]);
      }

      // 6. Catat kas baru atau hutang baru
      if (updatedSale.paymentMethod != PaymentMethod.credit) {
        await txn.insert('cash_movements', {
          'id': const Uuid().v4(),
          'date': updatedSale.date.toIso8601String(),
          'type': 'income',
          'amount': updatedSale.finalAmount,
          'category': 'Penjualan Kasir',
          'notes': 'Faktur #${updatedSale.invoiceNo} (${updatedSale.paymentMethod.label}) [Edit]',
          'ref_no': updatedSale.invoiceNo,
        });
      } else if (updatedSale.customerId != null) {
        await txn.rawUpdate('''
          UPDATE customers SET current_debt = current_debt + ?, updated_at = ? WHERE id = ?
        ''', [updatedSale.finalAmount, nowIso, updatedSale.customerId]);
      }
    });
  }

  // ================= TRANSAKSI KASIR (CHECKOUT) =================
  Future<void> saveTransaction(SaleModel sale) async {
    final db = await instance.database;
    await db.transaction((txn) async {
      // 1. Simpan Header Penjualan
      await txn.insert('sales', sale.toMap());

      // 2. Simpan Item Detail & Potong Stok Produk
      for (final item in sale.items) {
        await txn.insert('sale_items', item.toMap());
        await txn.rawUpdate('''
          UPDATE products
          SET stock = stock - ?, updated_at = ?
          WHERE id = ?
        ''', [item.quantity, DateTime.now().toIso8601String(), item.productId]);
      }

      // 3. Jika bayar tunai/qris/transfer, catat uang masuk ke Buku Kas
      if (sale.paymentMethod != PaymentMethod.credit) {
        await txn.insert('cash_movements', {
          'id': const Uuid().v4(),
          'date': sale.date.toIso8601String(),
          'type': 'income',
          'amount': sale.finalAmount,
          'category': 'Penjualan Kasir',
          'notes': 'Faktur #${sale.invoiceNo} (${sale.paymentMethod.label})',
          'ref_no': sale.invoiceNo,
        });
      }

      // 4. Jika bayar tempo (kredit), catat penambahan hutang pelanggan
      if (sale.paymentMethod == PaymentMethod.credit && sale.customerId != null) {
        await txn.rawUpdate('''
          UPDATE customers 
          SET current_debt = current_debt + ?, updated_at = ?
          WHERE id = ?
        ''', [sale.finalAmount, DateTime.now().toIso8601String(), sale.customerId]);
      }
    });
  }

  // ================= BUKU KAS (CASH MOVEMENTS) =================
  Future<List<CashMovementModel>> getCashMovements({int limit = 50}) async {
    final db = await instance.database;
    final maps = await db.query('cash_movements', orderBy: 'date DESC', limit: limit);
    return maps.map((m) => CashMovementModel.fromMap(m)).toList();
  }

  Future<void> addCashMovement(CashMovementModel movement) async {
    final db = await instance.database;
    await db.insert('cash_movements', movement.toMap());
  }

  Future<Map<String, int>> getCashSummaryToday() async {
    final db = await instance.database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day).toIso8601String();

    final incomeResult = await db.rawQuery('''
      SELECT SUM(amount) as total FROM cash_movements 
      WHERE type = 'income' AND date >= ?
    ''', [startOfDay]);

    final expenseResult = await db.rawQuery('''
      SELECT SUM(amount) as total FROM cash_movements 
      WHERE type = 'expense' AND date >= ?
    ''', [startOfDay]);

    final income = (incomeResult.first['total'] as num?)?.toInt() ?? 0;
    final expense = (expenseResult.first['total'] as num?)?.toInt() ?? 0;

    return {
      'income': income,
      'expense': expense,
      'balance': income - expense,
    };
  }

  // Generate Invoice Number otomatis: INV-YYYYMMDD-XXXX
  Future<String> generateNextInvoiceNo() async {
    final db = await instance.database;
    final now = DateTime.now();
    final datePrefix = 'INV-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';

    final result = await db.rawQuery('''
      SELECT COUNT(*) as count FROM sales WHERE invoice_no LIKE ?
    ''', ['$datePrefix%']);

    final count = (result.first['count'] as int? ?? 0) + 1;
    return '$datePrefix-${count.toString().padLeft(4, '0')}';
  }

  // ==================== FASE 5: SETTINGS, BACKUP, SYNC & LAPORAN ====================

  Future<void> _ensureSettingsTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');
  }

  Future<String?> getSetting(String key) async {
    final db = await instance.database;
    await _ensureSettingsTable(db);
    final rows = await db.query('app_settings', where: 'key = ?', whereArgs: [key], limit: 1);
    if (rows.isEmpty) return null;
    return rows.first['value'] as String?;
  }

  Future<void> setSetting(String key, String value) async {
    final db = await instance.database;
    await _ensureSettingsTable(db);
    await db.insert(
      'app_settings',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Ekspor seluruh tabel SQLite ke struktur Map siap JSON untuk backup lokal / cloud
  Future<Map<String, dynamic>> exportFullBackupData() async {
    final db = await instance.database;
    final categories = await db.query('categories');
    final products = await db.query('products');
    final customers = await db.query('customers');
    final sales = await db.query('sales');
    final saleItems = await db.query('sale_items');
    final cashMovements = await db.query('cash_movements');

    return {
      'app': 'kasirku_pos_umkm',
      'version': 1,
      'exportedAt': DateTime.now().toIso8601String(),
      'tables': {
        'categories': categories,
        'products': products,
        'customers': customers,
        'sales': sales,
        'sale_items': saleItems,
        'cash_movements': cashMovements,
      },
    };
  }

  Future<void> _clearDataTables(Transaction txn) async {
    await txn.delete('sale_items');
    await txn.delete('sales');
    await txn.delete('cash_movements');
    await txn.delete('customers');
    await txn.delete('products');
    await txn.delete('categories');
  }

  /// Hapus seluruh data toko (Reset Toko) secara atomik
  Future<void> clearAllData() async {
    final db = await instance.database;
    await _ensureSettingsTable(db);
    await db.transaction((txn) async {
      await _clearDataTables(txn);
      await txn.delete('app_settings');
    });
  }

  /// Pulihkan seluruh data toko dari Map JSON backup secara atomik
  Future<void> restoreFullBackupData(Map<String, dynamic> backup) async {
    final tables = backup['tables'];
    if (tables is! Map<String, dynamic>) {
      throw const FormatException('Format file backup tidak valid (tabel tidak ditemukan).');
    }

    final db = await instance.database;
    await db.transaction((txn) async {
      await _clearDataTables(txn);

      const orderedTables = [
        'categories',
        'products',
        'customers',
        'sales',
        'sale_items',
        'cash_movements',
      ];

      for (final tableName in orderedTables) {
        final rows = tables[tableName];
        if (rows is List) {
          for (final row in rows) {
            if (row is Map) {
              await txn.insert(
                tableName,
                Map<String, Object?>.from(row),
                conflictAlgorithm: ConflictAlgorithm.replace,
              );
            }
          }
        }
      }
    });
  }

  /// Ambil ringkasan laporan penjualan (Omzet, Keuntungan Bersih, Jumlah Transaksi, Top Produk)
  Future<Map<String, dynamic>> getSalesReport({
    required DateTime start,
    required DateTime end,
  }) async {
    final db = await instance.database;
    final startIso = start.toIso8601String();
    final endIso = end.toIso8601String();

    final summaryRows = await db.rawQuery('''
      SELECT
        COUNT(*) as tx_count,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE date >= ? AND date <= ?
    ''', [startIso, endIso]);

    final profitRows = await db.rawQuery('''
      SELECT
        COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0) as gross_profit
      FROM sale_items si
      INNER JOIN sales s ON s.invoice_no = si.invoice_no
      WHERE s.date >= ? AND s.date <= ?
    ''', [startIso, endIso]);

    final topProducts = await db.rawQuery('''
      SELECT
        si.product_name as product_name,
        SUM(si.quantity) as total_qty,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      INNER JOIN sales s ON s.invoice_no = si.invoice_no
      WHERE s.date >= ? AND s.date <= ?
      GROUP BY si.product_id, si.product_name
      ORDER BY total_qty DESC
      LIMIT 5
    ''', [startIso, endIso]);

    final txCount = (summaryRows.first['tx_count'] as num?)?.toInt() ?? 0;
    final totalRevenue = (summaryRows.first['total_revenue'] as num?)?.toInt() ?? 0;
    final totalDiscount = (summaryRows.first['total_discount'] as num?)?.toInt() ?? 0;
    final grossProfit = (profitRows.first['gross_profit'] as num?)?.toInt() ?? 0;

    return {
      'transactionCount': txCount,
      'totalRevenue': totalRevenue,
      'totalDiscount': totalDiscount,
      'netProfit': grossProfit - totalDiscount,
      'topProducts': topProducts,
    };
  }

  /// Ambil daftar transaksi beserta item untuk ekspor CSV / sinkronisasi Google Sheets
  Future<List<Map<String, dynamic>>> getSalesWithItemsForExport({
    DateTime? start,
    DateTime? end,
  }) async {
    final db = await instance.database;
    final List<Map<String, dynamic>> salesRows;

    if (start != null && end != null) {
      salesRows = await db.query(
        'sales',
        where: 'date >= ? AND date <= ?',
        whereArgs: [start.toIso8601String(), end.toIso8601String()],
        orderBy: 'date DESC',
      );
    } else {
      salesRows = await db.query('sales', orderBy: 'date DESC');
    }

    final List<Map<String, dynamic>> result = [];
    for (final sale in salesRows) {
      final items = await db.query(
        'sale_items',
        where: 'invoice_no = ?',
        whereArgs: [sale['invoice_no']],
      );
      result.add({
        ...sale,
        'items': items,
      });
    }
    return result;
  }
}
