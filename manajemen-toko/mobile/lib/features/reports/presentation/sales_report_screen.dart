import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../../core/database/app_database.dart';
import '../../../core/services/report_export_service.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../models/customer_model.dart';
import '../../../models/product_model.dart';
import '../../../models/sale_model.dart';
import '../../pos/presentation/receipt_dialog.dart';

enum ReportFilterMode { today, month, range, all }

class SalesReportScreen extends StatefulWidget {
  const SalesReportScreen({super.key});

  @override
  State<SalesReportScreen> createState() => _SalesReportScreenState();
}

class _SalesReportScreenState extends State<SalesReportScreen> {
  List<SaleModel> _allSales = [];
  List<ProductModel> _products = [];
  List<CustomerModel> _customers = [];
  bool _isLoading = true;

  ReportFilterMode _filterMode = ReportFilterMode.month;
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime(DateTime.now().year, DateTime.now().month, 1),
    end: DateTime.now(),
  );
  PaymentMethod? _paymentFilter;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final sales = await AppDatabase.instance.getSalesHistoryWithItems();
    final products = await AppDatabase.instance.getProducts();
    final customers = await AppDatabase.instance.getCustomers();
    if (mounted) {
      setState(() {
        _allSales = sales;
        _products = products;
        _customers = customers;
        _isLoading = false;
      });
    }
  }

  List<SaleModel> get _filteredSales {
    final now = DateTime.now();
    final q = _searchController.text.trim().toLowerCase();

    return _allSales.where((s) {
      if (_filterMode == ReportFilterMode.today) {
        if (s.date.year != now.year || s.date.month != now.month || s.date.day != now.day) {
          return false;
        }
      } else if (_filterMode == ReportFilterMode.month) {
        if (s.date.year != _selectedMonth.year || s.date.month != _selectedMonth.month) {
          return false;
        }
      } else if (_filterMode == ReportFilterMode.range) {
        final start = DateTime(_dateRange.start.year, _dateRange.start.month, _dateRange.start.day);
        final end = DateTime(_dateRange.end.year, _dateRange.end.month, _dateRange.end.day, 23, 59, 59);
        if (s.date.isBefore(start) || s.date.isAfter(end)) return false;
      }

      if (_paymentFilter != null && s.paymentMethod != _paymentFilter) return false;

      if (q.isNotEmpty) {
        final matchInv = s.invoiceNo.toLowerCase().contains(q);
        final matchCust = s.customerName.toLowerCase().contains(q);
        final matchItem = s.items.any((it) => it.productName.toLowerCase().contains(q));
        if (!matchInv && !matchCust && !matchItem) return false;
      }

      return true;
    }).toList();
  }

  Future<void> _pickMonth() async {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    int tempYear = _selectedMonth.year;
    int tempMonth = _selectedMonth.month;

    final picked = await showDialog<DateTime>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Pilih Bulan & Tahun', style: TextStyle(fontSize: 16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: () => setDialogState(() => tempYear--),
                  ),
                  Text(
                    '$tempYear',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: () => setDialogState(() => tempYear++),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: List.generate(12, (idx) {
                  final m = idx + 1;
                  final selected = m == tempMonth;
                  return ChoiceChip(
                    label: Text(months[idx]),
                    selected: selected,
                    onSelected: (_) => Navigator.pop(ctx, DateTime(tempYear, m)),
                  );
                }),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ],
        ),
      ),
    );
    if (picked != null) {
      setState(() => _selectedMonth = picked);
    }
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      initialDateRange: _dateRange,
    );
    if (picked != null) {
      setState(() => _dateRange = picked);
    }
  }

  Future<void> _exportFilteredCsv() async {
    final list = _filteredSales;
    if (list.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak ada transaksi pada filter ini untuk diekspor.')),
      );
      return;
    }

    final rows = list.map((s) {
      return {
        'invoice_no': s.invoiceNo,
        'date': s.date.toIso8601String(),
        'customer_name': s.customerName,
        'payment_method': s.paymentMethod.name,
        'payment_status': s.paymentStatus,
        'total_amount': s.totalAmount,
        'discount': s.discount,
        'final_amount': s.finalAmount,
        'items': s.items.map((it) => {'product_name': it.productName, 'quantity': it.quantity}).toList(),
      };
    }).toList();

    final csv = ReportExportService.instance.generateSalesCsv(rows);
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/laporan_transaksi_${DateTime.now().millisecondsSinceEpoch}.csv');
    await file.writeAsString(csv, flush: true);

    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: 'text/csv')],
        text: 'Laporan Transaksi Kasirku',
      ),
    );
  }

  Future<void> _showEditSaleDialog(SaleModel sale) async {
    final editableItems = sale.items
        .map((it) => SaleItemModel(
              id: it.id,
              invoiceNo: it.invoiceNo,
              productId: it.productId,
              productName: it.productName,
              costPrice: it.costPrice,
              sellingPrice: it.sellingPrice,
              quantity: it.quantity,
              subtotal: it.subtotal,
            ))
        .toList();

    PaymentMethod method = sale.paymentMethod;
    String? selectedCustomerId = sale.customerId;
    final discountCtrl = TextEditingController(
      text: sale.discount > 0 ? CurrencyFormatter.formatNumber(sale.discount) : '',
    );
    final cashCtrl = TextEditingController(
      text: sale.cashReceived > 0 ? CurrencyFormatter.formatNumber(sale.cashReceived) : '',
    );
    ProductModel? productToAdd;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final subtotal = editableItems.fold<int>(0, (sum, it) => sum + it.subtotal);
          final discount = CurrencyFormatter.parseClean(discountCtrl.text);
          final finalAmount = (subtotal - discount).clamp(0, 999999999);

          return AlertDialog(
            title: Text('Edit Faktur ${sale.invoiceNo}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            content: SizedBox(
              width: 460,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_products.isNotEmpty)
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<ProductModel>(
                              initialValue: productToAdd,
                              isExpanded: true,
                              isDense: true,
                              decoration: const InputDecoration(labelText: 'Tambah Barang'),
                              items: _products
                                  .map((p) => DropdownMenuItem(
                                        value: p,
                                        child: Text('${p.name} (${CurrencyFormatter.formatRupiah(p.sellingPrice)})',
                                            overflow: TextOverflow.ellipsis),
                                      ))
                                  .toList(),
                              onChanged: (val) => setDialogState(() => productToAdd = val),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(
                            onPressed: productToAdd == null
                                ? null
                                : () {
                                    final p = productToAdd!;
                                    setDialogState(() {
                                      final idx = editableItems.indexWhere((it) => it.productId == p.id);
                                      if (idx >= 0) {
                                        final old = editableItems[idx];
                                        final nextQty = old.quantity + 1;
                                        editableItems[idx] = SaleItemModel(
                                          id: old.id,
                                          invoiceNo: sale.invoiceNo,
                                          productId: old.productId,
                                          productName: old.productName,
                                          costPrice: old.costPrice,
                                          sellingPrice: old.sellingPrice,
                                          quantity: nextQty,
                                          subtotal: old.sellingPrice * nextQty,
                                        );
                                      } else {
                                        editableItems.add(SaleItemModel(
                                          id: '${sale.invoiceNo}-${p.id}-${DateTime.now().millisecondsSinceEpoch}',
                                          invoiceNo: sale.invoiceNo,
                                          productId: p.id,
                                          productName: p.name,
                                          costPrice: p.costPrice,
                                          sellingPrice: p.sellingPrice,
                                          quantity: 1,
                                          subtotal: p.sellingPrice,
                                        ));
                                      }
                                      productToAdd = null;
                                    });
                                  },
                            icon: const Icon(Icons.add),
                          ),
                        ],
                      ),
                    const SizedBox(height: 12),
                    ...editableItems.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final it = entry.value;
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(it.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text('${CurrencyFormatter.formatRupiah(it.sellingPrice)} x ${it.quantity}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                              onPressed: it.quantity <= 1
                                  ? null
                                  : () {
                                      setDialogState(() {
                                        final q = it.quantity - 1;
                                        editableItems[idx] = SaleItemModel(
                                          id: it.id,
                                          invoiceNo: it.invoiceNo,
                                          productId: it.productId,
                                          productName: it.productName,
                                          costPrice: it.costPrice,
                                          sellingPrice: it.sellingPrice,
                                          quantity: q,
                                          subtotal: it.sellingPrice * q,
                                        );
                                      });
                                    },
                            ),
                            Text('${it.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, size: 20, color: Color(0xFF059669)),
                              onPressed: () {
                                setDialogState(() {
                                  final q = it.quantity + 1;
                                  editableItems[idx] = SaleItemModel(
                                    id: it.id,
                                    invoiceNo: it.invoiceNo,
                                    productId: it.productId,
                                    productName: it.productName,
                                    costPrice: it.costPrice,
                                    sellingPrice: it.sellingPrice,
                                    quantity: q,
                                    subtotal: it.sellingPrice * q,
                                  );
                                });
                              },
                            ),
                            if (editableItems.length > 1)
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFDC2626)),
                                onPressed: () => setDialogState(() => editableItems.removeAt(idx)),
                              ),
                          ],
                        ),
                      );
                    }),
                    const Divider(),
                    DropdownButtonFormField<String?>(
                      initialValue: selectedCustomerId,
                      isExpanded: true,
                      isDense: true,
                      decoration: const InputDecoration(labelText: 'Pelanggan'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Pelanggan Umum (Tunai)')),
                        ..._customers.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                      ],
                      onChanged: (val) => setDialogState(() => selectedCustomerId = val),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<PaymentMethod>(
                      initialValue: method,
                      isDense: true,
                      decoration: const InputDecoration(labelText: 'Metode Pembayaran'),
                      items: PaymentMethod.values
                          .map((m) => DropdownMenuItem(value: m, child: Text(m.label)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => method = val);
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: discountCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [ThousandSeparatorInputFormatter()],
                      decoration: const InputDecoration(labelText: 'Diskon (Rp)', prefixText: 'Rp '),
                      onChanged: (_) => setDialogState(() {}),
                    ),
                    if (method == PaymentMethod.cash) ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: cashCtrl,
                        keyboardType: TextInputType.number,
                        inputFormatters: [ThousandSeparatorInputFormatter()],
                        decoration: const InputDecoration(labelText: 'Uang Diterima (Rp)', prefixText: 'Rp '),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Baru:', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text(
                            CurrencyFormatter.formatRupiah(finalAmount),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF059669)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
              ElevatedButton(
                onPressed: () async {
                  final navigator = Navigator.of(ctx);
                  final messenger = ScaffoldMessenger.of(context);
                  if (method == PaymentMethod.credit && selectedCustomerId == null) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Pembayaran tempo wajib memilih pelanggan.')),
                    );
                    return;
                  }

                  final cust = _customers.where((c) => c.id == selectedCustomerId).firstOrNull;
                  final cashVal = method == PaymentMethod.cash
                      ? (CurrencyFormatter.parseClean(cashCtrl.text) == 0
                          ? finalAmount
                          : CurrencyFormatter.parseClean(cashCtrl.text))
                      : (method == PaymentMethod.credit ? 0 : finalAmount);

                  if (method == PaymentMethod.cash && cashVal < finalAmount) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Uang diterima kurang dari total baru.')),
                    );
                    return;
                  }

                  final updated = SaleModel(
                    invoiceNo: sale.invoiceNo,
                    date: sale.date,
                    customerName: cust?.name ?? 'Pelanggan Umum',
                    customerId: cust?.id,
                    totalAmount: subtotal,
                    discount: discount,
                    finalAmount: finalAmount,
                    paymentMethod: method,
                    cashReceived: cashVal,
                    changeAmount: method == PaymentMethod.cash ? (cashVal - finalAmount).clamp(0, 999999999) : 0,
                    paymentStatus: method == PaymentMethod.credit ? 'unpaid' : 'paid',
                    dueDate: sale.dueDate,
                    items: editableItems,
                  );

                  await AppDatabase.instance.updateTransaction(updated);
                  navigator.pop(true);
                },
                child: const Text('Simpan'),
              ),
            ],
          );
        },
      ),
    );

    if (saved == true) {
      await _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transaksi ${sale.invoiceNo} berhasil diperbarui!')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredSales;
    final totalRevenue = list.fold<int>(0, (sum, s) => sum + s.finalAmount);
    final totalDiscount = list.fold<int>(0, (sum, s) => sum + s.discount);
    final totalCost = list.fold<int>(
      0,
      (sum, s) => sum + s.items.fold<int>(0, (sub, it) => sub + (it.costPrice * it.quantity)),
    );
    final netProfit = totalRevenue - totalCost;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Laporan & Edit Transaksi'),
        actions: [
          IconButton(
            tooltip: 'Ekspor CSV',
            icon: const Icon(Icons.download_outlined),
            onPressed: _exportFilteredCsv,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ChoiceChip(
                        label: const Text('Hari Ini'),
                        selected: _filterMode == ReportFilterMode.today,
                        onSelected: (_) => setState(() => _filterMode = ReportFilterMode.today),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: Text('Bulan (${_selectedMonth.month}/${_selectedMonth.year})'),
                        selected: _filterMode == ReportFilterMode.month,
                        onSelected: (_) {
                          setState(() => _filterMode = ReportFilterMode.month);
                          _pickMonth();
                        },
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('Rentang Tanggal'),
                        selected: _filterMode == ReportFilterMode.range,
                        onSelected: (_) {
                          setState(() => _filterMode = ReportFilterMode.range);
                          _pickDateRange();
                        },
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('Semua'),
                        selected: _filterMode == ReportFilterMode.all,
                        onSelected: (_) => setState(() => _filterMode = ReportFilterMode.all),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: _searchController,
                        decoration: const InputDecoration(
                          hintText: 'Cari faktur / pelanggan / barang...',
                          prefixIcon: Icon(Icons.search, size: 18),
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<PaymentMethod?>(
                        initialValue: _paymentFilter,
                        isDense: true,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Semua Bayar', overflow: TextOverflow.ellipsis)),
                          ...PaymentMethod.values.map(
                            (m) => DropdownMenuItem(
                              value: m,
                              child: Text(m.label, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ],
                        onChanged: (val) => setState(() => _paymentFilter = val),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // KPI summary strip
          Container(
            margin: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _kpiItem('Transaksi', '${list.length}', const Color(0xFF0F172A)),
                _kpiItem('Omzet', CurrencyFormatter.formatRupiah(totalRevenue), const Color(0xFF2563EB)),
                _kpiItem('Diskon', CurrencyFormatter.formatRupiah(totalDiscount), const Color(0xFFD97706)),
                _kpiItem('Laba', CurrencyFormatter.formatRupiah(netProfit), const Color(0xFF059669)),
              ],
            ),
          ),

          // Sales list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? const Center(
                        child: Text('Belum ada transaksi sesuai filter ini.', style: TextStyle(color: Colors.grey)),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(12),
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (ctx, idx) {
                            final s = list[idx];
                            return Card(
                              margin: EdgeInsets.zero,
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            s.invoiceNo,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: s.paymentMethod == PaymentMethod.credit
                                                ? const Color(0xFFFEF3C7)
                                                : const Color(0xFFD1FAE5),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            s.paymentMethod.label,
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: s.paymentMethod == PaymentMethod.credit
                                                  ? const Color(0xFFD97706)
                                                  : const Color(0xFF047857),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${DateFormatter.formatShortDateTime(s.date)} • ${s.customerName}',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      s.items.map((it) => '${it.productName} (${it.quantity}x)').join(', '),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          CurrencyFormatter.formatRupiah(s.finalAmount),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            color: Color(0xFF059669),
                                          ),
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            OutlinedButton.icon(
                                              onPressed: () {
                                                showDialog(
                                                  context: context,
                                                  builder: (_) => ReceiptDialog(sale: s),
                                                );
                                              },
                                              style: OutlinedButton.styleFrom(
                                                minimumSize: const Size(0, 34),
                                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              ),
                                              icon: const Icon(Icons.print, size: 15),
                                              label: const Text('Struk', style: TextStyle(fontSize: 12)),
                                            ),
                                            const SizedBox(width: 6),
                                            ElevatedButton.icon(
                                              onPressed: () => _showEditSaleDialog(s),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF2563EB),
                                                minimumSize: const Size(0, 34),
                                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              ),
                                              icon: const Icon(Icons.edit, size: 15),
                                              label: const Text('Edit', style: TextStyle(fontSize: 12)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _kpiItem(String label, String value, Color color) {
    return Flexible(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}
