class ProductModel {
  final String id;
  final String sku;
  final String barcode;
  final String name;
  final String category;
  final String unit;
  final int costPrice;
  final int sellingPrice;
  final int stock;
  final int minStock;
  final DateTime updatedAt;

  const ProductModel({
    required this.id,
    this.sku = '',
    this.barcode = '',
    required this.name,
    this.category = 'Umum',
    this.unit = 'pcs',
    required this.costPrice,
    required this.sellingPrice,
    required this.stock,
    this.minStock = 5,
    required this.updatedAt,
  });

  bool get isOutOfStock => stock <= 0;
  bool get isLowStock => stock > 0 && stock <= minStock;

  ProductModel copyWith({
    String? id,
    String? sku,
    String? barcode,
    String? name,
    String? category,
    String? unit,
    int? costPrice,
    int? sellingPrice,
    int? stock,
    int? minStock,
    DateTime? updatedAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      sku: sku ?? this.sku,
      barcode: barcode ?? this.barcode,
      name: name ?? this.name,
      category: category ?? this.category,
      unit: unit ?? this.unit,
      costPrice: costPrice ?? this.costPrice,
      sellingPrice: sellingPrice ?? this.sellingPrice,
      stock: stock ?? this.stock,
      minStock: minStock ?? this.minStock,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sku': sku,
      'barcode': barcode,
      'name': name,
      'category': category,
      'unit': unit,
      'cost_price': costPrice,
      'selling_price': sellingPrice,
      'stock': stock,
      'min_stock': minStock,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory ProductModel.fromMap(Map<String, dynamic> map) {
    return ProductModel(
      id: map['id'] as String,
      sku: (map['sku'] ?? '') as String,
      barcode: (map['barcode'] ?? '') as String,
      name: map['name'] as String,
      category: (map['category'] ?? 'Umum') as String,
      unit: (map['unit'] ?? 'pcs') as String,
      costPrice: (map['cost_price'] as num).toInt(),
      sellingPrice: (map['selling_price'] as num).toInt(),
      stock: (map['stock'] as num).toInt(),
      minStock: (map['min_stock'] as num?)?.toInt() ?? 5,
      updatedAt: DateTime.tryParse(map['updated_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
