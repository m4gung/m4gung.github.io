import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/services/report_export_service.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../core/widgets/adaptive_layout.dart';
import '../../../models/cash_movement_model.dart';
import '../../reports/presentation/sales_report_screen.dart';

class CashbookScreen extends StatefulWidget {
  const CashbookScreen({super.key});

  @override
  State<CashbookScreen> createState() => _CashbookScreenState();
}

class _CashbookScreenState extends State<CashbookScreen> {
  List<CashMovementModel> _movements = [];
  Map<String, int> _summary = {'income': 0, 'expense': 0, 'balance': 0};
  Map<String, dynamic> _salesReport = {
    'transactionCount': 0,
    'totalRevenue': 0,
    'netProfit': 0,
    'topProducts': <dynamic>[],
  };
  bool _isMonthlyReport = false;
  bool _isLoading = true;

  // State formulir inline untuk mode Tablet
  CashType _formType = CashType.expense;
  final TextEditingController _tabletAmountController = TextEditingController();
  final TextEditingController _tabletCategoryController = TextEditingController();
  final TextEditingController _tabletNotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCashData();
  }

  @override
  void dispose() {
    _tabletAmountController.dispose();
    _tabletCategoryController.dispose();
    _tabletNotesController.dispose();
    super.dispose();
  }

  (DateTime, DateTime, String) _getReportRange() {
    final now = DateTime.now();
    if (_isMonthlyReport) {
      return (
        DateTime(now.year, now.month, 1),
        DateTime(now.year, now.month + 1, 0, 23, 59, 59, 999),
        'Bulan Ini',
      );
    }
    return (
      DateTime(now.year, now.month, now.day),
      DateTime(now.year, now.month, now.day, 23, 59, 59, 999),
      'Hari Ini',
    );
  }

  Future<void> _loadCashData() async {
    final list = await AppDatabase.instance.getCashMovements();
    final sum = await AppDatabase.instance.getCashSummaryToday();
    final (start, end, _) = _getReportRange();
    final report = await AppDatabase.instance.getSalesReport(start: start, end: end);
    if (mounted) {
      setState(() {
        _movements = list;
        _summary = sum;
        _salesReport = report;
        _isLoading = false;
      });
    }
  }

  Future<void> _exportCsv() async {
    final messenger = ScaffoldMessenger.of(context);
    final (start, end, label) = _getReportRange();
    try {
      await ReportExportService.instance.exportAndShareSalesCsv(
        start: start,
        end: end,
        periodLabel: label,
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Gagal ekspor CSV: $e')));
    }
  }

  Future<void> _exportJournalCsv() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ReportExportService.instance.exportAndShareCashbookCsv();
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Gagal ekspor jurnal CSV: $e')));
    }
  }

  Future<void> _openSalesReport() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SalesReportScreen()),
    );
    _loadCashData();
  }

  Future<void> _printPdfSummary() async {
    final (_, _, label) = _getReportRange();
    await ReportExportService.instance.printFinancialSummaryPdf(
      periodLabel: label,
      report: _salesReport,
      cashSummary: _summary,
    );
  }

  Future<void> _saveTabletForm() async {
    final amount = CurrencyFormatter.parseClean(_tabletAmountController.text);
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Masukkan jumlah uang lebih dari Rp 0')),
      );
      return;
    }

    final isExpense = _formType == CashType.expense;
    final movement = CashMovementModel(
      id: const Uuid().v4(),
      date: DateTime.now(),
      type: _formType,
      amount: amount,
      category: _tabletCategoryController.text.trim().isNotEmpty
          ? _tabletCategoryController.text.trim()
          : (isExpense ? 'Pengeluaran Lainnya' : 'Pemasukan Lainnya'),
      notes: _tabletNotesController.text.trim(),
    );

    await AppDatabase.instance.addCashMovement(movement);
    _tabletAmountController.clear();
    _tabletCategoryController.clear();
    _tabletNotesController.clear();
    await _loadCashData();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${_formType.label} berhasil dicatat!')),
      );
    }
  }

  Future<void> _showAddCashDialog(CashType type) async {
    final amountController = TextEditingController();
    final categoryController = TextEditingController();
    final notesController = TextEditingController();

    final isExpense = type == CashType.expense;

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isExpense ? 'Catat Pengeluaran Uang' : 'Catat Uang Masuk', style: const TextStyle(fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              inputFormatters: [ThousandSeparatorInputFormatter()],
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(labelText: 'Jumlah Uang (Rp) *', prefixText: 'Rp '),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: categoryController,
              decoration: InputDecoration(
                labelText: isExpense ? 'Keperluan (Listrik, Sewa, Gaji)' : 'Sumber Uang (Modal, Titipan)',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(labelText: 'Catatan Tambahan (Opsional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isExpense ? const Color(0xFFDC2626) : const Color(0xFF059669),
            ),
            onPressed: () async {
              final amount = CurrencyFormatter.parseClean(amountController.text);
              if (amount <= 0) return;

              final movement = CashMovementModel(
                id: const Uuid().v4(),
                date: DateTime.now(),
                type: type,
                amount: amount,
                category: categoryController.text.trim().isNotEmpty
                    ? categoryController.text.trim()
                    : (isExpense ? 'Pengeluaran Lainnya' : 'Pemasukan Lainnya'),
                notes: notesController.text.trim(),
              );

              await AppDatabase.instance.addCashMovement(movement);
              if (ctx.mounted) Navigator.pop(ctx, true);
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );

    if (result == true) {
      _loadCashData();
    }
  }

  Widget _buildLeftListPane({required bool isTablet}) {
    return Column(
      children: [
        // Kartu Ringkasan Kas Hari Ini
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('ARUS KAS HARI INI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Uang Masuk (+)', style: TextStyle(fontSize: 12, color: Color(0xFF059669), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        CurrencyFormatter.formatRupiah(_summary['income'] ?? 0),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Uang Keluar (-)', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        CurrencyFormatter.formatRupiah(_summary['expense'] ?? 0),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Sisa Kas Bersih', style: TextStyle(fontSize: 12, color: Color(0xFF0F172A), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        CurrencyFormatter.formatRupiah(_summary['balance'] ?? 0),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                    ],
                  ),
                ],
              ),
              const Divider(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    _isMonthlyReport ? 'OMZET & LABA BULAN INI' : 'OMZET & LABA HARI INI',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                  ),
                  SegmentedButton<bool>(
                    style: SegmentedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      textStyle: const TextStyle(fontSize: 11),
                    ),
                    segments: const [
                      ButtonSegment(value: false, label: Text('Hari Ini')),
                      ButtonSegment(value: true, label: Text('Bulan Ini')),
                    ],
                    selected: {_isMonthlyReport},
                    onSelectionChanged: (sel) {
                      setState(() => _isMonthlyReport = sel.first);
                      _loadCashData();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Omzet Kotor', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text(
                        CurrencyFormatter.formatRupiah(_salesReport['totalRevenue'] as int? ?? 0),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Laba Bersih', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text(
                        CurrencyFormatter.formatRupiah(_salesReport['netProfit'] as int? ?? 0),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Transaksi', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text(
                        '${_salesReport['transactionCount'] ?? 0} struk',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                    ],
                  ),
                ],
              ),
              if ((_salesReport['topProducts'] as List<dynamic>? ?? []).isNotEmpty) ...[
                const SizedBox(height: 10),
                const Text('Barang Paling Laris:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: (_salesReport['topProducts'] as List<dynamic>).take(3).map((p) {
                    final row = p as Map<String, dynamic>;
                    return Chip(
                      visualDensity: VisualDensity.compact,
                      backgroundColor: const Color(0xFFF1F5F9),
                      label: Text('${row['product_name']} (${row['total_qty']}x)', style: const TextStyle(fontSize: 11)),
                    );
                  }).toList(),
                ),
              ],
              const Divider(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: _openSalesReport,
                    icon: const Icon(Icons.receipt_long_outlined, size: 18, color: Color(0xFF2563EB)),
                    label: const Text('Laporan & Edit Transaksi', style: TextStyle(fontSize: 12, color: Color(0xFF2563EB))),
                  ),
                  OutlinedButton.icon(
                    onPressed: _exportJournalCsv,
                    icon: const Icon(Icons.table_view_outlined, size: 18, color: Color(0xFF059669)),
                    label: const Text('Ekspor Jurnal (CSV)', style: TextStyle(fontSize: 12, color: Color(0xFF059669))),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Tombol Cepat Pemasukan & Pengeluaran hanya untuk HP (Tablet pakai panel kanan)
        if (!isTablet) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showAddCashDialog(CashType.income),
                    icon: const Icon(Icons.arrow_downward, size: 18),
                    label: const Text('Uang Masuk (+)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(42),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showAddCashDialog(CashType.expense),
                    icon: const Icon(Icons.arrow_upward, size: 18),
                    label: const Text('Pengeluaran (-)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(42),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Riwayat Transaksi Kas
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _movements.isEmpty
                  ? const Center(child: Text('Belum ada catatan mutasi kas'))
                  : RefreshIndicator(
                      onRefresh: _loadCashData,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                        itemCount: _movements.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final m = _movements[index];
                          final isIncome = m.type == CashType.income;

                          return Card(
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isIncome ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                                child: Icon(
                                  isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                                  color: isIncome ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                ),
                              ),
                              title: Text(m.category, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (m.notes.isNotEmpty) Text(m.notes, style: const TextStyle(fontSize: 12)),
                                  Text(
                                    DateFormatter.formatShortDateTime(m.date),
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                              trailing: Text(
                                '${isIncome ? '+' : '-'} ${CurrencyFormatter.formatRupiah(m.amount)}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: isIncome ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildRightTabletForm() {
    final isExpense = _formType == CashType.expense;
    final quickCategories = isExpense
        ? ['Bayar Listrik', 'Plastik / Kemasan', 'Gaji Karyawan', 'Sewa Toko', 'Transport / Bensin']
        : ['Modal Tambahan', 'Titipan Kas', 'Lainnya'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Catat Transaksi Kas Baru',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              SegmentedButton<CashType>(
                segments: const [
                  ButtonSegment(
                    value: CashType.expense,
                    icon: Icon(Icons.arrow_upward, size: 16),
                    label: Text('Pengeluaran (-)'),
                  ),
                  ButtonSegment(
                    value: CashType.income,
                    icon: Icon(Icons.arrow_downward, size: 16),
                    label: Text('Uang Masuk (+)'),
                  ),
                ],
                selected: {_formType},
                onSelectionChanged: (sel) {
                  setState(() {
                    _formType = sel.first;
                    _tabletCategoryController.clear();
                  });
                },
              ),
              const SizedBox(height: 16),
              const Text('Jumlah Uang (Rp) *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              TextField(
                controller: _tabletAmountController,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandSeparatorInputFormatter()],
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                decoration: const InputDecoration(prefixText: 'Rp ', hintText: '0'),
              ),
              const SizedBox(height: 14),
              const Text('Keperluan / Kategori', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: quickCategories.map((cat) {
                  return ActionChip(
                    label: Text(cat, style: const TextStyle(fontSize: 12)),
                    onPressed: () {
                      setState(() => _tabletCategoryController.text = cat);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _tabletCategoryController,
                decoration: InputDecoration(
                  hintText: isExpense ? 'Atau ketik keperluan...' : 'Atau ketik sumber uang...',
                ),
              ),
              const SizedBox(height: 14),
              const Text('Catatan Tambahan (Opsional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              TextField(
                controller: _tabletNotesController,
                decoration: const InputDecoration(hintText: 'Keterangan singkat...'),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _saveTabletForm,
                icon: const Icon(Icons.save),
                label: Text(isExpense ? 'SIMPAN PENGELUARAN' : 'SIMPAN UANG MASUK'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isExpense ? const Color(0xFFDC2626) : const Color(0xFF059669),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = AdaptiveLayout.isTablet(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buku Kas & Laporan'),
        actions: [
          IconButton(
            tooltip: 'Laporan & Edit Transaksi',
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SalesReportScreen()),
              ).then((_) => _loadCashData());
            },
          ),
          IconButton(
            tooltip: 'Ekspor Excel (.csv)',
            icon: const Icon(Icons.table_view_outlined),
            onPressed: _exportCsv,
          ),
          IconButton(
            tooltip: 'Cetak PDF Laporan',
            icon: const Icon(Icons.picture_as_pdf_outlined),
            onPressed: _printPdfSummary,
          ),
        ],
      ),
      body: isTablet
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 6, child: _buildLeftListPane(isTablet: true)),
                const VerticalDivider(width: 1, thickness: 1, color: Color(0xFFE2E8F0)),
                Expanded(flex: 4, child: _buildRightTabletForm()),
              ],
            )
          : _buildLeftListPane(isTablet: false),
    );
  }
}
