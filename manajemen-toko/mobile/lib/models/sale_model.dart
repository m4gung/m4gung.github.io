enum PaymentMethod {
  cash('Tunai (Cash)'),
  qris('QRIS Toko'),
  transfer('Transfer Bank'),
  credit('Tempo (Hutang)');

  final String label;
  const PaymentMethod(this.label);
}

class SaleItemModel {
  final String id;
  final String invoiceNo;
  final String productId;
  final String productName;
  final int costPrice;
  final int sellingPrice;
  final int quantity;
  final int subtotal;

  const SaleItemModel({
    required this.id,
    required this.invoiceNo,
    required this.productId,
    required this.productName,
    required this.costPrice,
    required this.sellingPrice,
    required this.quantity,
    required this.subtotal,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'invoice_no': invoiceNo,
      'product_id': productId,
      'product_name': productName,
      'cost_price': costPrice,
      'selling_price': sellingPrice,
      'quantity': quantity,
      'subtotal': subtotal,
    };
  }

  factory SaleItemModel.fromMap(Map<String, dynamic> map) {
    return SaleItemModel(
      id: map['id'] as String,
      invoiceNo: map['invoice_no'] as String,
      productId: map['product_id'] as String,
      productName: map['product_name'] as String,
      costPrice: (map['cost_price'] as num).toInt(),
      sellingPrice: (map['selling_price'] as num).toInt(),
      quantity: (map['quantity'] as num).toInt(),
      subtotal: (map['subtotal'] as num).toInt(),
    );
  }
}

class SaleModel {
  final String invoiceNo;
  final DateTime date;
  final String customerName;
  final String? customerId;
  final int totalAmount;
  final int discount;
  final int finalAmount;
  final PaymentMethod paymentMethod;
  final int cashReceived;
  final int changeAmount;
  final String paymentStatus; // 'PAID' or 'UNPAID'
  final DateTime? dueDate;
  final List<SaleItemModel> items;

  const SaleModel({
    required this.invoiceNo,
    required this.date,
    this.customerName = 'Pelanggan Umum',
    this.customerId,
    required this.totalAmount,
    this.discount = 0,
    required this.finalAmount,
    required this.paymentMethod,
    required this.cashReceived,
    required this.changeAmount,
    required this.paymentStatus,
    this.dueDate,
    this.items = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'invoice_no': invoiceNo,
      'date': date.toIso8601String(),
      'customer_name': customerName,
      'customer_id': customerId,
      'total_amount': totalAmount,
      'discount': discount,
      'final_amount': finalAmount,
      'payment_method': paymentMethod.name.toUpperCase(),
      'cash_received': cashReceived,
      'change_amount': changeAmount,
      'payment_status': paymentStatus,
      'due_date': dueDate?.toIso8601String(),
    };
  }

  factory SaleModel.fromMap(Map<String, dynamic> map, {List<SaleItemModel> items = const []}) {
    final methodStr = (map['payment_method'] ?? 'CASH').toString().toLowerCase();
    final method = PaymentMethod.values.firstWhere(
      (m) => m.name.toLowerCase() == methodStr,
      orElse: () => PaymentMethod.cash,
    );

    return SaleModel(
      invoiceNo: map['invoice_no'] as String,
      date: DateTime.tryParse(map['date']?.toString() ?? '') ?? DateTime.now(),
      customerName: (map['customer_name'] ?? 'Pelanggan Umum') as String,
      customerId: map['customer_id'] as String?,
      totalAmount: (map['total_amount'] as num).toInt(),
      discount: (map['discount'] as num?)?.toInt() ?? 0,
      finalAmount: (map['final_amount'] as num).toInt(),
      paymentMethod: method,
      cashReceived: (map['cash_received'] as num?)?.toInt() ?? 0,
      changeAmount: (map['change_amount'] as num?)?.toInt() ?? 0,
      paymentStatus: (map['payment_status'] ?? 'PAID') as String,
      dueDate: map['due_date'] != null ? DateTime.tryParse(map['due_date'].toString()) : null,
      items: items,
    );
  }
}
