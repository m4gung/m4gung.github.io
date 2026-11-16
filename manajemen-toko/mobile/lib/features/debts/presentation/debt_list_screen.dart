import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/adaptive_layout.dart';
import '../../../models/cash_movement_model.dart';
import '../../../models/customer_model.dart';

class DebtListScreen extends StatefulWidget {
  const DebtListScreen({super.key});

  @override
  State<DebtListScreen> createState() => _DebtListScreenState();
}

class _DebtListScreenState extends State<DebtListScreen> {
  List<CustomerModel> _customers = [];
  CustomerModel? _selectedCustomer;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    final list = await AppDatabase.instance.getCustomers();
    if (mounted) {
      setState(() {
        _customers = list;
        _isLoading = false;
        if (_selectedCustomer != null) {
          final updated = list.where((c) => c.id == _selectedCustomer!.id).toList();
          _selectedCustomer = updated.isNotEmpty ? updated.first : (list.isNotEmpty ? list.first : null);
        } else if (list.isNotEmpty) {
          _selectedCustomer = list.first;
        }
      });
    }
  }

  int get _totalAllDebt => _customers.fold(0, (sum, c) => sum + c.currentDebt);

  Future<void> _showPayDebtDialog(CustomerModel customer) async {
    final controller = TextEditingController(text: CurrencyFormatter.formatNumber(customer.currentDebt));
    final result = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Bayar Hutang: ${customer.name}', style: const TextStyle(fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Total Hutang Saat Ini: ${CurrencyFormatter.formatRupiah(customer.currentDebt)}'),
            const SizedBox(height: 12),
            const Text('Jumlah yang Dibayarkan:'),
            const SizedBox(height: 6),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              inputFormatters: [ThousandSeparatorInputFormatter()],
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(prefixText: 'Rp '),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              final paid = CurrencyFormatter.parseClean(controller.text);
              if (paid > 0) Navigator.pop(ctx, paid);
            },
            child: const Text('Terima Pembayaran'),
          ),
        ],
      ),
    );

    if (result != null && result > 0) {
      await AppDatabase.instance.updateCustomerDebt(customer.id, -result);

      await AppDatabase.instance.addCashMovement(
        CashMovementModel(
          id: const Uuid().v4(),
          date: DateTime.now(),
          type: CashType.income,
          amount: result,
          category: 'Pelunasan Hutang',
          notes: 'Pembayaran hutang dari ${customer.name}',
        ),
      );

      _loadCustomers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pembayaran hutang ${CurrencyFormatter.formatRupiah(result)} dicatat!')),
        );
      }
    }
  }

  Future<void> _sendReminderWhatsApp(CustomerModel customer) async {
    final msg = Uri.encodeComponent(
      'Halo ${customer.name}, kami dari Toko Berkah Jaya ingin mengingatkan catatan tagihan belanja sebesar ${CurrencyFormatter.formatRupiah(customer.currentDebt)}. Terima kasih!',
    );
    final cleanPhone = customer.phone.replaceAll(RegExp(r'[^0-9]'), '');
    final formattedPhone = cleanPhone.startsWith('0') ? '62${cleanPhone.substring(1)}' : cleanPhone;
    final url = Uri.parse(
      formattedPhone.isNotEmpty ? 'https://wa.me/$formattedPhone?text=$msg' : 'https://wa.me/?text=$msg',
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _showCustomerFormDialog({CustomerModel? customer}) async {
    final isEdit = customer != null;
    final nameController = TextEditingController(text: customer?.name ?? '');
    final phoneController = TextEditingController(text: customer?.phone ?? '');
    final addressController = TextEditingController(text: customer?.address ?? '');
    final limitController = TextEditingController(
      text: customer != null && customer.creditLimit > 0
          ? CurrencyFormatter.formatNumber(customer.creditLimit)
          : (isEdit ? '0' : ''),
    );

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Nama Pelanggan *')),
              const SizedBox(height: 8),
              TextField(controller: phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'No. WhatsApp/HP')),
              const SizedBox(height: 8),
              TextField(controller: addressController, decoration: const InputDecoration(labelText: 'Alamat (Opsional)')),
              const SizedBox(height: 8),
              TextField(
                controller: limitController,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandSeparatorInputFormatter()],
                decoration: const InputDecoration(
                  labelText: 'Batas Limit Hutang (Opsional)',
                  hintText: '0 (Isi 0 jika tidak boleh hutang)',
                  prefixText: 'Rp ',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.trim().isEmpty) return;
              final limit = CurrencyFormatter.parseClean(limitController.text);
              final updated = CustomerModel(
                id: customer?.id ?? const Uuid().v4(),
                name: nameController.text.trim(),
                phone: phoneController.text.trim(),
                address: addressController.text.trim(),
                creditLimit: limit,
                currentDebt: customer?.currentDebt ?? 0,
                updatedAt: DateTime.now(),
              );
              await AppDatabase.instance.upsertCustomer(updated);
              if (ctx.mounted) Navigator.pop(ctx, true);
            },
            child: Text(isEdit ? 'Simpan Perubahan' : 'Simpan'),
          ),
        ],
      ),
    );

    if (result == true) {
      await _loadCustomers();
    }
  }

  Widget _buildMasterList({required bool isTablet}) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TOTAL HUTANG DI PELANGGAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))),
                  SizedBox(height: 2),
                  Text('Uang toko yang belum tertagih', style: TextStyle(fontSize: 11, color: Color(0xFF7F1D1D))),
                ],
              ),
              Text(
                CurrencyFormatter.formatRupiah(_totalAllDebt),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _customers.isEmpty
                  ? const Center(child: Text('Belum ada data pelanggan'))
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                      itemCount: _customers.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final c = _customers[index];
                        final hasDebt = c.currentDebt > 0;
                        final isSelected = isTablet && _selectedCustomer?.id == c.id;

                        return Card(
                          color: isSelected ? const Color(0xFFECFDF5) : Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: isSelected ? const Color(0xFF059669) : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: ListTile(
                            onTap: isTablet
                                ? () => setState(() => _selectedCustomer = c)
                                : (hasDebt ? () => _showPayDebtDialog(c) : null),
                            leading: CircleAvatar(
                              backgroundColor: hasDebt ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9),
                              child: Icon(
                                Icons.person,
                                color: hasDebt ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                              ),
                            ),
                            title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(
                              c.phone.isNotEmpty ? c.phone : 'Tanpa nomor telepon',
                              style: const TextStyle(fontSize: 12),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      CurrencyFormatter.formatRupiah(c.currentDebt),
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: hasDebt ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                                      ),
                                    ),
                                    if (hasDebt)
                                      InkWell(
                                        onTap: () => _showPayDebtDialog(c),
                                        child: const Text(
                                          'Bayar Cicilan >',
                                          style: TextStyle(color: Color(0xFF059669), fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      )
                                    else
                                      const Text('Lunas (Rp 0)', style: TextStyle(color: Color(0xFF059669), fontSize: 11)),
                                  ],
                                ),
                                IconButton(
                                  tooltip: 'Edit Pelanggan',
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF64748B)),
                                  onPressed: () => _showCustomerFormDialog(customer: c),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildDetailPane() {
    final c = _selectedCustomer;
    if (c == null) {
      return const Center(
        child: Text('Pilih pelanggan di sebelah kiri untuk melihat detail hutang', style: TextStyle(color: Color(0xFF64748B))),
      );
    }

    final hasDebt = c.currentDebt > 0;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: hasDebt ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                        child: Icon(
                          Icons.person,
                          size: 28,
                          color: hasDebt ? const Color(0xFFDC2626) : const Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            Text(
                              c.phone.isNotEmpty ? 'WhatsApp: ${c.phone}' : 'Belum ada nomor telepon',
                              style: const TextStyle(color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Edit Pelanggan',
                        onPressed: () => _showCustomerFormDialog(customer: c),
                        icon: const Icon(Icons.edit_outlined, color: Color(0xFF2563EB)),
                      ),
                    ],
                  ),
                  const Divider(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Hutang Berjalan', style: TextStyle(color: Color(0xFF64748B))),
                      Text(
                        CurrencyFormatter.formatRupiah(c.currentDebt),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: hasDebt ? const Color(0xFFDC2626) : const Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Batas Maksimal Hutang (Limit)', style: TextStyle(color: Color(0xFF64748B))),
                      Text(CurrencyFormatter.formatRupiah(c.creditLimit), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Sisa Plafon Bisa Dipakai', style: TextStyle(color: Color(0xFF64748B))),
                      Text(
                        CurrencyFormatter.formatRupiah(c.remainingCredit),
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (hasDebt) ...[
                    ElevatedButton.icon(
                      onPressed: () => _showPayDebtDialog(c),
                      icon: const Icon(Icons.payments_outlined),
                      label: const Text('Catat Pembayaran Cicilan / Lunas'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () => _sendReminderWhatsApp(c),
                      icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                      label: const Text('Kirim Pengingat Tagihan via WhatsApp', style: TextStyle(color: Color(0xFF0F172A))),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ] else
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD1FAE5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF059669)),
                          SizedBox(width: 8),
                          Text('Pelanggan ini tidak memiliki tunggakan hutang.', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = AdaptiveLayout.isTablet(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buku Hutang Pelanggan'),
      ),
      body: isTablet
          ? Row(
              children: [
                Expanded(flex: 5, child: _buildMasterList(isTablet: true)),
                const VerticalDivider(width: 1, thickness: 1, color: Color(0xFFE2E8F0)),
                Expanded(flex: 5, child: _buildDetailPane()),
              ],
            )
          : _buildMasterList(isTablet: false),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCustomerFormDialog(),
        icon: const Icon(Icons.person_add),
        label: const Text('Tambah Pelanggan'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
    );
  }
}
