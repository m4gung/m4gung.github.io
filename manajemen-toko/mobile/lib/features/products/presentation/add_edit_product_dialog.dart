import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../models/category_model.dart';
import '../../../models/product_model.dart';
import '../../pos/presentation/barcode_scanner_modal.dart';

class AddEditProductDialog extends StatefulWidget {
  final ProductModel? product;

  const AddEditProductDialog({super.key, this.product});

  @override
  State<AddEditProductDialog> createState() => _AddEditProductDialogState();
}

class _AddEditProductDialogState extends State<AddEditProductDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _barcodeController;
  late TextEditingController _costPriceController;
  late TextEditingController _sellingPriceController;
  late TextEditingController _stockController;
  late TextEditingController _minStockController;

  String _selectedCategory = 'Umum';
  List<CategoryModel> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _nameController = TextEditingController(text: p?.name ?? '');
    _barcodeController = TextEditingController(text: p?.barcode ?? '');
    _costPriceController = TextEditingController(
      text: p != null ? CurrencyFormatter.formatNumber(p.costPrice) : '',
    );
    _sellingPriceController = TextEditingController(
      text: p != null ? CurrencyFormatter.formatNumber(p.sellingPrice) : '',
    );
    _stockController = TextEditingController(
      text: p != null ? p.stock.toString() : '0',
    );
    _minStockController = TextEditingController(
      text: p != null ? p.minStock.toString() : '5',
    );
    _selectedCategory = p?.category ?? 'Umum';
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final list = await AppDatabase.instance.getCategories();
    if (mounted) {
      setState(() {
        _categories = list;
        _isLoading = false;
        if (list.isNotEmpty && !list.any((c) => c.name == _selectedCategory)) {
          _selectedCategory = list.first.name;
        }
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _barcodeController.dispose();
    _costPriceController.dispose();
    _sellingPriceController.dispose();
    _stockController.dispose();
    _minStockController.dispose();
    super.dispose();
  }

  Future<void> _scanBarcode() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (ctx) => const BarcodeScannerModal()),
    );
    if (code != null && mounted) {
      setState(() {
        _barcodeController.text = code;
      });
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;

    final cost = CurrencyFormatter.parseClean(_costPriceController.text);
    final selling = CurrencyFormatter.parseClean(_sellingPriceController.text);
    final stock = int.tryParse(_stockController.text.trim()) ?? 0;
    final minStock = int.tryParse(_minStockController.text.trim()) ?? 5;

    final product = ProductModel(
      id: widget.product?.id ?? const Uuid().v4(),
      sku: widget.product?.sku ?? 'SKU-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      barcode: _barcodeController.text.trim(),
      name: _nameController.text.trim(),
      category: _selectedCategory,
      unit: 'pcs',
      costPrice: cost,
      sellingPrice: selling,
      stock: stock,
      minStock: minStock,
      updatedAt: DateTime.now(),
    );

    if (widget.product == null) {
      await AppDatabase.instance.insertProduct(product);
    } else {
      await AppDatabase.instance.updateProduct(product);
    }

    if (mounted) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.product != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEdit ? 'Ubah Data Produk' : 'Tambah Produk Baru',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(),

                // Nama Produk
                const Text('Nama Barang / Produk *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(hintText: 'Misal: Kopi Susu Sachet'),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Nama barang wajib diisi' : null,
                ),
                const SizedBox(height: 12),

                // Barcode + Tombol Kamera
                const Text('Barcode / Kode QR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _barcodeController,
                        decoration: const InputDecoration(hintText: 'Scan atau ketik kode barcode'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      onPressed: _scanBarcode,
                      icon: const Icon(Icons.camera_alt),
                      style: IconButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Kategori
                const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                if (_isLoading)
                  const LinearProgressIndicator()
                else
                  DropdownButtonFormField<String>(
                    initialValue: _selectedCategory,
                    decoration: const InputDecoration(),
                    items: _categories.map((c) {
                      return DropdownMenuItem(value: c.name, child: Text(c.name));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategory = val);
                    },
                  ),
                const SizedBox(height: 12),

                // Harga Beli & Jual (Dua Kolom)
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Harga Modal (Rp) *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _costPriceController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [ThousandSeparatorInputFormatter()],
                            decoration: const InputDecoration(prefixText: 'Rp '),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Isi harga modal' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Harga Jual (Rp) *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _sellingPriceController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [ThousandSeparatorInputFormatter()],
                            decoration: const InputDecoration(prefixText: 'Rp '),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Isi harga jual' : null,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Stok & Peringatan Minimum (Dua Kolom)
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Stok Saat Ini *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _stockController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(hintText: '0'),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Isi jumlah stok' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Batas Stok Sedikit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _minStockController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(hintText: '5'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Tombol Simpan
                ElevatedButton(
                  onPressed: _saveProduct,
                  child: Text(isEdit ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK', style: const TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
