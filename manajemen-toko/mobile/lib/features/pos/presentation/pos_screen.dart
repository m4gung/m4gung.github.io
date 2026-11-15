import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/adaptive_layout.dart';
import '../../../models/category_model.dart';
import '../../../models/product_model.dart';
import '../controllers/pos_controller.dart';
import 'barcode_scanner_modal.dart';
import 'checkout_modal.dart';
import 'tablet_cart_panel.dart';

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({super.key});

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _scannerFocusNode = FocusNode();
  final StringBuffer _barcodeBuffer = StringBuffer();
  DateTime _lastKeyTime = DateTime.now();

  List<ProductModel> _products = [];
  List<CategoryModel> _categories = [];
  String _selectedCategory = 'Semua';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scannerFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final prods = await AppDatabase.instance.getProducts();
    final cats = await AppDatabase.instance.getCategories();
    if (mounted) {
      setState(() {
        _products = prods;
        _categories = cats;
        _isLoading = false;
      });
    }
  }

  Future<void> _filterProducts() async {
    final prods = await AppDatabase.instance.getProducts(
      query: _searchController.text.trim(),
      category: _selectedCategory,
    );
    if (mounted) {
      setState(() {
        _products = prods;
      });
    }
  }

  Future<void> _handleScannedBarcode(String scannedCode) async {
    final success = await ref.read(posProvider.notifier).scanBarcode(scannedCode);
    if (!mounted) return;
    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Produk barcode "$scannedCode" tidak ditemukan.'),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Barang berhasil ditambahkan ke keranjang!'),
          duration: Duration(milliseconds: 800),
        ),
      );
    }
  }

  Future<void> _openBarcodeScanner() async {
    final scannedCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (ctx) => const BarcodeScannerModal()),
    );

    if (scannedCode != null && mounted) {
      await _handleScannedBarcode(scannedCode);
    }
  }

  /// Mendeteksi input dari Hardware Barcode Scanner Gun & Shortcut Keyboard Fisik iPad
  KeyEventResult _onHardwareKeyEvent(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;

    if (event.logicalKey == LogicalKeyboardKey.f1) {
      _openBarcodeScanner();
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.f12) {
      if (ref.read(posProvider).items.isNotEmpty) {
        _showCartSheet();
      }
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.escape) {
      _searchController.clear();
      _filterProducts();
      FocusScope.of(context).unfocus();
      return KeyEventResult.handled;
    }

    final now = DateTime.now();
    // Jika jeda antar ketikan > 250ms, reset buffer (bedakan scanner gun dari ketikan manual)
    if (now.difference(_lastKeyTime).inMilliseconds > 250) {
      _barcodeBuffer.clear();
    }
    _lastKeyTime = now;

    if (event.logicalKey == LogicalKeyboardKey.enter || event.logicalKey == LogicalKeyboardKey.numpadEnter) {
      final code = _barcodeBuffer.toString().trim();
      _barcodeBuffer.clear();
      if (code.length >= 3) {
        _handleScannedBarcode(code);
        return KeyEventResult.handled;
      }
      return KeyEventResult.ignored;
    }

    final char = event.character;
    if (char != null && char.isNotEmpty && !char.contains('\n') && !char.contains('\r')) {
      _barcodeBuffer.write(char);
    }

    return KeyEventResult.ignored;
  }

  Future<void> _showCartSheet() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => const CheckoutModal(),
    );
    _filterProducts();
  }

  Widget _buildCatalogArea({required bool isTablet}) {
    final posState = ref.watch(posProvider);

    return Column(
      children: [
        // Bar Pencarian & Tombol Scanner
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: isTablet
                        ? 'Cari barang atau tembak barcode scanner USB/Bluetooth...'
                        : 'Cari nama barang / barcode...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _filterProducts();
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                  onChanged: (_) => _filterProducts(),
                  onSubmitted: (val) {
                    // Jika Enter ditekan di search bar (mis. dari scanner gun), cek barcode langsung
                    final trimmed = val.trim();
                    if (trimmed.isNotEmpty) {
                      AppDatabase.instance.getProductByBarcode(trimmed).then((found) {
                        if (found != null) {
                          ref.read(posProvider.notifier).addToCart(found);
                          _searchController.clear();
                          _filterProducts();
                        }
                      });
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: _openBarcodeScanner,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.qr_code_scanner, color: Colors.white),
                ),
              ),
            ],
          ),
        ),

        // Horizontal Category Chips
        SizedBox(
          height: 42,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: const Text('Semua'),
                  selected: _selectedCategory == 'Semua',
                  selectedColor: const Color(0xFFD1FAE5),
                  onSelected: (val) {
                    if (val) {
                      setState(() => _selectedCategory = 'Semua');
                      _filterProducts();
                    }
                  },
                ),
              ),
              ..._categories.map((cat) {
                final isSelected = _selectedCategory == cat.name;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(cat.name),
                    selected: isSelected,
                    selectedColor: const Color(0xFFD1FAE5),
                    onSelected: (val) {
                      if (val) {
                        setState(() => _selectedCategory = cat.name);
                        _filterProducts();
                      }
                    },
                  ),
                );
              }),
            ],
          ),
        ),

        const SizedBox(height: 8),

        // Grid Produk Katalog (Responsif jumlah kolom)
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _products.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          const Text('Tidak ada produk ditemukan', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : LayoutBuilder(
                      builder: (context, constraints) {
                        final columns = isTablet
                            ? AdaptiveLayout.catalogGridColumns(constraints.maxWidth)
                            : 2;

                        return RefreshIndicator(
                          onRefresh: _filterProducts,
                          child: GridView.builder(
                            padding: EdgeInsets.fromLTRB(16, 8, 16, isTablet ? 16 : 90),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: columns,
                              childAspectRatio: isTablet ? 0.92 : 0.88,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                            ),
                            itemCount: _products.length,
                            itemBuilder: (context, index) {
                              final product = _products[index];
                              final cartItem = posState.items[product.id];
                              final inCartQty = cartItem?.quantity ?? 0;

                              return Card(
                                clipBehavior: Clip.antiAlias,
                                child: InkWell(
                                  hoverColor: const Color(0xFFECFDF5),
                                  onTap: product.isOutOfStock
                                      ? null
                                      : () {
                                          ref.read(posProvider.notifier).addToCart(product);
                                        },
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: product.isOutOfStock
                                                    ? const Color(0xFFFEE2E2)
                                                    : product.isLowStock
                                                        ? const Color(0xFFFEF3C7)
                                                        : const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                product.isOutOfStock
                                                    ? 'Habis'
                                                    : 'Sisa: ${product.stock} ${product.unit}',
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: product.isOutOfStock
                                                      ? const Color(0xFFDC2626)
                                                      : product.isLowStock
                                                          ? const Color(0xFFD97706)
                                                          : const Color(0xFF64748B),
                                                ),
                                              ),
                                            ),
                                            if (inCartQty > 0)
                                              CircleAvatar(
                                                radius: 11,
                                                backgroundColor: const Color(0xFF059669),
                                                child: Text(
                                                  '$inCartQty',
                                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const Spacer(),
                                        Text(
                                          product.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          CurrencyFormatter.formatRupiah(product.sellingPrice),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            color: Color(0xFF059669),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        SizedBox(
                                          width: double.infinity,
                                          height: 32,
                                          child: ElevatedButton(
                                            onPressed: product.isOutOfStock
                                                ? null
                                                : () {
                                                    ref.read(posProvider.notifier).addToCart(product);
                                                  },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF059669),
                                              padding: EdgeInsets.zero,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                            ),
                                            child: Text(
                                              product.isOutOfStock ? 'Stok Habis' : '+ Tambah',
                                              style: const TextStyle(fontSize: 12),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final posState = ref.watch(posProvider);
    final isTablet = AdaptiveLayout.isTablet(context);

    return Focus(
      focusNode: _scannerFocusNode,
      autofocus: true,
      onKeyEvent: _onHardwareKeyEvent,
      child: Scaffold(
        appBar: AppBar(
          title: Text(isTablet ? 'Kasir Meja POS (Mode Tablet)' : 'Kasir POS (Toko)'),
          actions: [
            if (!isTablet && !posState.isEmpty)
              IconButton(
                icon: const Icon(Icons.delete_sweep, color: Color(0xFFDC2626)),
                tooltip: 'Kosongkan Keranjang',
                onPressed: () {
                  ref.read(posProvider.notifier).clearCart();
                },
              ),
          ],
        ),
        body: isTablet
            ? Row(
                children: [
                  // Sisi Kiri (60%): Area Katalog Toko
                  Expanded(
                    flex: 6,
                    child: _buildCatalogArea(isTablet: true),
                  ),
                  const VerticalDivider(width: 1, thickness: 1, color: Color(0xFFE2E8F0)),
                  // Sisi Kanan (40%): Keranjang Kasir Statis + Numpad
                  Expanded(
                    flex: 4,
                    child: TabletCartPanel(
                      onCheckoutSuccess: _filterProducts,
                    ),
                  ),
                ],
              )
            : _buildCatalogArea(isTablet: false),

        // Floating Cart Bar hanya untuk HP (Mode Tablet sudah punya keranjang statis di kanan)
        bottomSheet: !isTablet && !posState.isEmpty
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${posState.totalItemCount} Barang Terpilih',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                            ),
                            Text(
                              CurrencyFormatter.formatRupiah(posState.finalAmount),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _showCartSheet,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: const Row(
                          children: [
                            Text('BAYAR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward, size: 18),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : null,
      ),
    );
  }
}
