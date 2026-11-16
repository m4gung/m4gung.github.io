import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../models/customer_model.dart';

/// Dialog tambah pelanggan cepat dari halaman kasir / checkout.
Future<CustomerModel?> showQuickAddCustomerDialog(BuildContext context) async {
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final limitCtrl = TextEditingController();

  return showDialog<CustomerModel>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Tambah Pelanggan Cepat', style: TextStyle(fontSize: 16)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'Nama Pelanggan *'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'No. WhatsApp/HP (Opsional)'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: limitCtrl,
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
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
        ElevatedButton(
          onPressed: () async {
            final name = nameCtrl.text.trim();
            if (name.isEmpty) return;
            final customer = CustomerModel(
              id: const Uuid().v4(),
              name: name,
              phone: phoneCtrl.text.trim(),
              creditLimit: CurrencyFormatter.parseClean(limitCtrl.text),
              currentDebt: 0,
              updatedAt: DateTime.now(),
            );
            await AppDatabase.instance.upsertCustomer(customer);
            if (ctx.mounted) Navigator.pop(ctx, customer);
          },
          child: const Text('Simpan'),
        ),
      ],
    ),
  );
}
