import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/app_database.dart';
import '../../../core/services/audio_feedback_service.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../models/customer_model.dart';
import '../../../models/sale_model.dart';
import '../controllers/pos_controller.dart';
import 'qris_display_widget.dart';
import 'quick_customer_dialog.dart';
import 'receipt_dialog.dart';

class CheckoutModal extends ConsumerStatefulWidget {
  const CheckoutModal({super.key});

  @override
  ConsumerState<CheckoutModal> createState() => _CheckoutModalState();
}

class _CheckoutModalState extends ConsumerState<CheckoutModal> {
  PaymentMethod _selectedMethod = PaymentMethod.cash;
  final TextEditingController _cashController = TextEditingController();
  int _cashReceived = 0;
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
        // Gunakan customer dari POS state jika ada
        final currentCust = ref.read(posProvider).customer;
        if (currentCust != null) {
          _selectedCustomer = list.firstWhere(
            (c) => c.id == currentCust.id,
            orElse: () => currentCust,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  void _setCash(int amount) {
    AudioFeedbackService.selectionTap();
    setState(() {
      _cashReceived = amount;
      _cashController.text = CurrencyFormatter.formatNumber(amount);
    });
  }

  void _addCash(int delta) {
    final current = _cashReceived;
    _setCash(current + delta);
  }

  @override
  Widget build(BuildContext context) {
    final posState = ref.watch(posProvider);
    final total = posState.finalAmount;
    final change = _cashReceived - total;
    final isCashShort = _selectedMethod == PaymentMethod.cash && change < 0;

    // Validasi Tempo/Hutang
    bool isCreditValid = true;
    String creditError = '';
    if (_selectedMethod == PaymentMethod.credit) {
      if (_selectedCustomer == null) {
        isCreditValid = false;
        creditError = 'Wajib memilih nama pelanggan untuk pembayaran tempo/hutang.';
      } else if (_selectedCustomer!.creditLimit <= 0) {
        isCreditValid = false;
        creditError = 'Pelanggan ini memiliki batas hutang Rp 0 (dilarang berhutang).';
      } else if ((_selectedCustomer!.currentDebt + total) > _selectedCustomer!.creditLimit) {
        isCreditValid = false;
        creditError = 'Hutang melebihi limit kredit! (Maks: ${CurrencyFormatter.formatRupiah(_selectedCustomer!.creditLimit)})';
      }
    }

    final bool canSubmit = (_selectedMethod != PaymentMethod.cash || !isCashShort) &&
        (_selectedMethod != PaymentMethod.credit || isCreditValid);

    return Center(
      heightFactor: 1.0,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
          children: [
            // Bar Header Modal
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Pembayaran Kasir',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(),

            // Card Total Tagihan Besar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Text('TOTAL TAGIHAN', style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    CurrencyFormatter.formatRupiah(total),
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Pilihan Metode Pembayaran
            const Text('Metode Pembayaran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: PaymentMethod.values.map((method) {
                final isSelected = _selectedMethod == method;
                return ChoiceChip(
                  label: Text(method.label),
                  selected: isSelected,
                  selectedColor: const Color(0xFFD1FAE5),
                  labelStyle: TextStyle(
                    color: isSelected ? const Color(0xFF047857) : const Color(0xFF334155),
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (val) {
                    if (val) {
                      setState(() {
                        _selectedMethod = method;
                        if (method == PaymentMethod.cash && _cashReceived == 0) {
                          _setCash(total); // Otomatis isi uang pas
                        }
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // KONTEN SPESIFIK: TUNAI (CASH)
            if (_selectedMethod == PaymentMethod.cash) ...[
              const Text('Uang Diterima dari Pelanggan', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _cashController,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandSeparatorInputFormatter()],
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                decoration: const InputDecoration(
                  prefixText: 'Rp ',
                  hintText: '0',
                ),
                onChanged: (val) {
                  setState(() {
                    _cashReceived = CurrencyFormatter.parseClean(val);
                  });
                },
              ),
              const SizedBox(height: 10),

              // Quick Cash Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ActionChip(
                      label: const Text('Uang Pas'),
                      backgroundColor: const Color(0xFFF1F5F9),
                      onPressed: () => _setCash(total),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('+10 rb'),
                      onPressed: () => _addCash(10000),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('+20 rb'),
                      onPressed: () => _addCash(20000),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('+50 rb'),
                      onPressed: () => _addCash(50000),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('+100 rb'),
                      onPressed: () => _addCash(100000),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Banner Kembalian Font Besar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isCashShort ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isCashShort ? 'UANG KURANG:' : 'KEMBALIAN:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isCashShort ? const Color(0xFFDC2626) : const Color(0xFF047857),
                      ),
                    ),
                    Text(
                      CurrencyFormatter.formatRupiah(change.abs()),
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: isCashShort ? const Color(0xFFDC2626) : const Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // KONTEN SPESIFIK: QRIS TOKO
            if (_selectedMethod == PaymentMethod.qris) ...[
              Center(child: QrisDisplayWidget(amount: total)),
            ],

            // KONTEN SPESIFIK: TEMPO (HUTANG)
            if (_selectedMethod == PaymentMethod.credit) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text('Pilih Nama Pelanggan (Wajib Hutang)', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      final added = await showQuickAddCustomerDialog(context);
                      if (added != null && mounted) {
                        setState(() {
                          _customers.add(added);
                          _selectedCustomer = added;
                        });
                        ref.read(posProvider.notifier).setCustomer(added);
                      }
                    },
                    icon: const Icon(Icons.person_add_alt_1, size: 16),
                    label: const Text('+ Pelanggan', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_isLoading)
                const LinearProgressIndicator()
              else
                DropdownButtonFormField<CustomerModel>(
                  initialValue: _selectedCustomer,
                  decoration: const InputDecoration(hintText: 'Pilih Pelanggan...'),
                  items: _customers.map((c) {
                    return DropdownMenuItem(
                      value: c,
                      child: Text('${c.name} (Hutang: ${CurrencyFormatter.formatRupiah(c.currentDebt)})'),
                    );
                  }).toList(),
                  onChanged: (cust) {
                    setState(() {
                      _selectedCustomer = cust;
                      ref.read(posProvider.notifier).setCustomer(cust);
                    });
                  },
                ),
              if (!isCreditValid && creditError.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  creditError,
                  style: const TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ],

            const SizedBox(height: 24),

            // Tombol Selesaikan Pembayaran
            ElevatedButton(
              onPressed: canSubmit
                  ? () async {
                      final sale = await ref.read(posProvider.notifier).processCheckout(
                            paymentMethod: _selectedMethod,
                            cashReceived: _cashReceived,
                          );
                      if (context.mounted) {
                        Navigator.pop(context); // Tutup modal checkout
                        // Buka dialog struk & cetak
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (ctx) => ReceiptDialog(sale: sale),
                        );
                      }
                    }
                  : null,
              child: const Text('SELESAIKAN PEMBAYARAN', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
