import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../models/customer_model.dart';
import '../../../models/sale_model.dart';
import '../controllers/pos_controller.dart';
import 'checkout_modal.dart';
import 'qris_display_widget.dart';
import 'quick_customer_dialog.dart';
import 'receipt_dialog.dart';

/// Panel keranjang kasir statis untuk Tablet/iPad (Sisi Kanan Dual-Pane 40%).
/// Dilengkapi Numpad terintegrasi agar kasir tidak terganggu keyboard virtual OS.
class TabletCartPanel extends ConsumerStatefulWidget {
  final VoidCallback? onCheckoutSuccess;

  const TabletCartPanel({super.key, this.onCheckoutSuccess});

  @override
  ConsumerState<TabletCartPanel> createState() => _TabletCartPanelState();
}

class _TabletCartPanelState extends ConsumerState<TabletCartPanel> {
  PaymentMethod _selectedMethod = PaymentMethod.cash;
  int _cashReceived = 0;
  bool _showNumpad = false;
  List<CustomerModel> _customers = [];
  CustomerModel? _selectedCustomer;

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
      });
    }
  }

  void _appendDigit(String digits) {
    final currentStr = _cashReceived == 0 ? '' : _cashReceived.toString();
    final nextStr = '$currentStr$digits';
    if (nextStr.length > 10) return;
    setState(() {
      _cashReceived = int.tryParse(nextStr) ?? _cashReceived;
    });
  }

  void _backspace() {
    final str = _cashReceived.toString();
    setState(() {
      if (str.length <= 1) {
        _cashReceived = 0;
      } else {
        _cashReceived = int.tryParse(str.substring(0, str.length - 1)) ?? 0;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final posState = ref.watch(posProvider);
    final total = posState.finalAmount;

    // Jika keranjang kosong, reset cashReceived agar transaksi berikutnya bersih
    if (posState.isEmpty && _cashReceived != 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _cashReceived = 0;
            _showNumpad = false;
          });
        }
      });
    }

    final effectiveCash = _cashReceived == 0 && _selectedMethod == PaymentMethod.cash && !posState.isEmpty
        ? total
        : _cashReceived;
    final change = effectiveCash - total;
    final isCashShort = _selectedMethod == PaymentMethod.cash && change < 0;

    // Validasi Tempo/Hutang
    bool isCreditValid = true;
    String creditError = '';
    if (_selectedMethod == PaymentMethod.credit) {
      if (_selectedCustomer == null) {
        isCreditValid = false;
        creditError = 'Pilih pelanggan dulu untuk tempo/hutang.';
      } else if (_selectedCustomer!.creditLimit <= 0) {
        isCreditValid = false;
        creditError = 'Limit hutang pelanggan ini Rp 0.';
      } else if ((_selectedCustomer!.currentDebt + total) > _selectedCustomer!.creditLimit) {
        isCreditValid = false;
        creditError = 'Melebihi limit (${CurrencyFormatter.formatRupiah(_selectedCustomer!.creditLimit)}).';
      }
    }

    final canSubmit = !posState.isEmpty &&
        (_selectedMethod != PaymentMethod.cash || !isCashShort) &&
        (_selectedMethod != PaymentMethod.credit || isCreditValid);
    final isCompactHeight = MediaQuery.sizeOf(context).height < 520;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Header Keranjang Statis
          Container(
            padding: EdgeInsets.symmetric(horizontal: 14, vertical: isCompactHeight ? 8 : 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shopping_cart, color: Color(0xFF059669), size: 20),
                      const SizedBox(width: 6),
                      const Flexible(
                        child: Text(
                          'Keranjang Kasir',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (!posState.isEmpty) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${posState.totalItemCount} item',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF047857),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (!posState.isEmpty)
                  TextButton.icon(
                    onPressed: () {
                      ref.read(posProvider.notifier).clearCart();
                      setState(() => _cashReceived = 0);
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: const Size(0, 32),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFDC2626)),
                    label: const Text('Hapus', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                  ),
              ],
            ),
          ),

          // Pilih Pelanggan (disembunyikan di HP landscape agar list produk lega; tersedia di modal BAYAR)
          if (!isCompactHeight)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<CustomerModel?>(
                      initialValue: _selectedCustomer,
                      isExpanded: true,
                      isDense: true,
                      decoration: const InputDecoration(
                        labelText: 'Pelanggan',
                        prefixIcon: Icon(Icons.person_outline, size: 20),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      items: [
                        const DropdownMenuItem<CustomerModel?>(
                          value: null,
                          child: Text('Pelanggan Umum (Tunai)'),
                        ),
                        ..._customers.map((c) {
                          return DropdownMenuItem<CustomerModel?>(
                            value: c,
                            child: Text(
                              '${c.name}${c.currentDebt > 0 ? ' (Hutang: ${CurrencyFormatter.formatNumber(c.currentDebt)})' : ''}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }),
                      ],
                      onChanged: (cust) {
                        setState(() {
                          _selectedCustomer = cust;
                          ref.read(posProvider.notifier).setCustomer(cust);
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    tooltip: 'Tambah Pelanggan Cepat',
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
                    icon: const Icon(Icons.person_add_alt_1, color: Color(0xFF059669)),
                  ),
                ],
              ),
            ),

          // Daftar Item Belanja
          Expanded(
            child: posState.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.point_of_sale_outlined, size: 56, color: Colors.grey.shade300),
                        const SizedBox(height: 8),
                        const Text(
                          'Belum ada barang dipilih',
                          style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Ketuk barang di kiri atau tembak barcode scanner',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    itemCount: posState.items.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final cartItem = posState.items.values.elementAt(index);
                      final p = cartItem.product;

                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    '${CurrencyFormatter.formatRupiah(p.sellingPrice)} x ${cartItem.quantity}',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            // Tombol - / Qty / +
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  onPressed: () => ref.read(posProvider.notifier).decrementQuantity(p.id),
                                  icon: const Icon(Icons.remove_circle_outline, size: 22),
                                  color: const Color(0xFF64748B),
                                  visualDensity: VisualDensity.compact,
                                ),
                                SizedBox(
                                  width: 24,
                                  child: Text(
                                    '${cartItem.quantity}',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => ref.read(posProvider.notifier).addToCart(p),
                                  icon: const Icon(Icons.add_circle_outline, size: 22),
                                  color: const Color(0xFF059669),
                                  visualDensity: VisualDensity.compact,
                                ),
                              ],
                            ),
                            const SizedBox(width: 6),
                            SizedBox(
                              width: 78,
                              child: Text(
                                CurrencyFormatter.formatNumber(cartItem.subtotal),
                                textAlign: TextAlign.right,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Bagian Bawah: Mode Ringkas (HP Landscape) vs Mode Lengkap (Tablet/iPad)
          if (isCompactHeight)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Total', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        Text(
                          CurrencyFormatter.formatRupiah(total),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: posState.isEmpty
                        ? null
                        : () async {
                            await showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              builder: (ctx) => const CheckoutModal(),
                            );
                            widget.onCheckoutSuccess?.call();
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      minimumSize: const Size(100, 42),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: const Text('BAYAR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            )
          else
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Metode Bayar
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: PaymentMethod.values.map((m) {
                      final selected = _selectedMethod == m;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(m.label, style: const TextStyle(fontSize: 12)),
                          selected: selected,
                          selectedColor: const Color(0xFFD1FAE5),
                          visualDensity: VisualDensity.compact,
                          onSelected: (val) {
                            if (val) {
                              setState(() => _selectedMethod = m);
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),

                if (_selectedMethod == PaymentMethod.qris && !posState.isEmpty) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => Dialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                QrisDisplayWidget(amount: total),
                                const SizedBox(height: 12),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  child: const Text('Tutup'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.qr_code_2, color: Color(0xFF059669)),
                    label: const Text('Tampilkan QRIS untuk Di-scan Pembeli'),
                  ),
                ],

                if (_selectedMethod == PaymentMethod.credit && !isCreditValid && !posState.isEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    creditError,
                    style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],

                if (_selectedMethod == PaymentMethod.cash && !posState.isEmpty) ...[
                  const SizedBox(height: 8),
                  // Baris Input Tunai + Toggle Numpad
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _showNumpad = !_showNumpad),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: _showNumpad ? const Color(0xFF059669) : const Color(0xFFCBD5E1)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Uang Tunai:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                Text(
                                  CurrencyFormatter.formatRupiah(effectiveCash),
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      IconButton.outlined(
                        onPressed: () => setState(() => _showNumpad = !_showNumpad),
                        icon: Icon(_showNumpad ? Icons.keyboard_hide : Icons.dialpad),
                        tooltip: 'Tampilkan/Sembunyikan Numpad POS',
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Quick Cash Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        ActionChip(
                          label: const Text('Uang Pas', style: TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          onPressed: () => setState(() => _cashReceived = total),
                        ),
                        const SizedBox(width: 4),
                        ActionChip(
                          label: const Text('+10rb', style: TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          onPressed: () => setState(() => _cashReceived = effectiveCash + 10000),
                        ),
                        const SizedBox(width: 4),
                        ActionChip(
                          label: const Text('+50rb', style: TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          onPressed: () => setState(() => _cashReceived = effectiveCash + 50000),
                        ),
                        const SizedBox(width: 4),
                        ActionChip(
                          label: const Text('+100rb', style: TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          onPressed: () => setState(() => _cashReceived = effectiveCash + 100000),
                        ),
                      ],
                    ),
                  ),

                  // Numpad Terintegrasi Tablet POS
                  if (_showNumpad) ...[
                    const SizedBox(height: 8),
                    _IntegratedNumpad(
                      onDigit: _appendDigit,
                      onBackspace: _backspace,
                      onClear: () => setState(() => _cashReceived = 0),
                    ),
                  ],

                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isCashShort ? 'Uang Kurang:' : 'Kembalian:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: isCashShort ? const Color(0xFFDC2626) : const Color(0xFF047857),
                        ),
                      ),
                      Text(
                        CurrencyFormatter.formatRupiah(change.abs()),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: isCashShort ? const Color(0xFFDC2626) : const Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 10),

                // Baris Total & Tombol Bayar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('TOTAL', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    Text(
                      CurrencyFormatter.formatRupiah(total),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  onPressed: canSubmit
                      ? () async {
                          final sale = await ref.read(posProvider.notifier).processCheckout(
                                paymentMethod: _selectedMethod,
                                cashReceived: effectiveCash,
                              );
                          setState(() {
                            _cashReceived = 0;
                            _showNumpad = false;
                            _selectedCustomer = null;
                          });
                          widget.onCheckoutSuccess?.call();
                          if (context.mounted) {
                            showDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (ctx) => ReceiptDialog(sale: sale),
                            );
                          }
                        }
                      : null,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('BAYAR & CETAK STRUK'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IntegratedNumpad extends StatelessWidget {
  final ValueChanged<String> onDigit;
  final VoidCallback onBackspace;
  final VoidCallback onClear;

  const _IntegratedNumpad({
    required this.onDigit,
    required this.onBackspace,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '000'];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.3,
      mainAxisSpacing: 4,
      crossAxisSpacing: 4,
      children: [
        ...keys.map((k) {
          return ElevatedButton(
            onPressed: () {
              if (k == 'C') {
                onClear();
              } else {
                onDigit(k);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: k == 'C' ? const Color(0xFFFEE2E2) : Colors.white,
              foregroundColor: k == 'C' ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
              minimumSize: Size.zero,
              padding: EdgeInsets.zero,
              elevation: 0,
              side: const BorderSide(color: Color(0xFFE2E8F0)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(k, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          );
        }),
      ],
    );
  }
}
