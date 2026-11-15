import 'package:flutter/material.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../models/product_model.dart';
import 'add_edit_product_dialog.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<ProductModel> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    final list = await AppDatabase.instance.getProducts(query: _searchController.text.trim());
    if (mounted) {
      setState(() {
        _products = list;
        _isLoading = false;
      });
    }
  }

  Future<void> _openAddEditDialog([ProductModel? product]) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AddEditProductDialog(product: product),
    );
    if (result == true) {
      _loadProducts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(product == null ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diubah!')),
        );
      }
    }
  }

  Future<void> _showStockCorrectionDialog(ProductModel product) async {
    final controller = TextEditingController(text: product.stock.toString());
    final result = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Koreksi Stok: ${product.name}', style: const TextStyle(fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Masukkan jumlah fisik stok yang ada saat ini:'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(suffixText: 'pcs'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              final newStock = int.tryParse(controller.text.trim());
              if (newStock != null) Navigator.pop(ctx, newStock);
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );

    if (result != null) {
      final updated = product.copyWith(stock: result, updatedAt: DateTime.now());
      await AppDatabase.instance.updateProduct(updated);
      _loadProducts();
    }
  }

  Future<void> _deleteProduct(ProductModel product) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Produk?'),
        content: Text('Apakah Anda yakin ingin menghapus "${product.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AppDatabase.instance.deleteProduct(product.id);
      _loadProducts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Katalog & Stok Barang'),
      ),
      body: Column(
        children: [
          // Bar Pencarian
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Cari barang berdasarkan nama / barcode...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadProducts();
                        },
                      )
                    : null,
              ),
              onChanged: (_) => _loadProducts(),
            ),
          ),

          // Daftar Produk
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
                            const Text('Belum ada produk tersimpan', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadProducts,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                          itemCount: _products.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final p = _products[index];
                            final margin = p.sellingPrice - p.costPrice;

                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(
                                      'Jual: ${CurrencyFormatter.formatRupiah(p.sellingPrice)} • Modal: ${CurrencyFormatter.formatRupiah(p.costPrice)}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    Text(
                                      'Laba Bersih: ${CurrencyFormatter.formatRupiah(margin)} / ${p.unit}',
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF059669), fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Badge Stok
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: p.isOutOfStock
                                            ? const Color(0xFFFEE2E2)
                                            : p.isLowStock
                                                ? const Color(0xFFFEF3C7)
                                                : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'Stok: ${p.stock}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: p.isOutOfStock
                                              ? const Color(0xFFDC2626)
                                              : p.isLowStock
                                                  ? const Color(0xFFD97706)
                                                  : const Color(0xFF334155),
                                        ),
                                      ),
                                    ),
                                    PopupMenuButton<String>(
                                      onSelected: (val) {
                                        if (val == 'edit') _openAddEditDialog(p);
                                        if (val == 'stock') _showStockCorrectionDialog(p);
                                        if (val == 'delete') _deleteProduct(p);
                                      },
                                      itemBuilder: (ctx) => [
                                        const PopupMenuItem(value: 'edit', child: Text('Ubah Data')),
                                        const PopupMenuItem(value: 'stock', child: Text('Koreksi Stok Fisik')),
                                        const PopupMenuItem(value: 'delete', child: Text('Hapus Produk', style: TextStyle(color: Colors.red))),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddEditDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Tambah Produk'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
    );
  }
}
