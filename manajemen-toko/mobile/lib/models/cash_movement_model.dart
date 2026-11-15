enum CashType {
  income('Uang Masuk (+)'),
  expense('Uang Keluar (-)');

  final String label;
  const CashType(this.label);
}

class CashMovementModel {
  final String id;
  final DateTime date;
  final CashType type;
  final int amount;
  final String category; // Misal: Penjualan Kasir, Bayar Listrik, Kulakan, Sewa
  final String notes;
  final String? refNo; // Nomor Faktur atau PO jika ada

  const CashMovementModel({
    required this.id,
    required this.date,
    required this.type,
    required this.amount,
    required this.category,
    this.notes = '',
    this.refNo,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'type': type.name,
      'amount': amount,
      'category': category,
      'notes': notes,
      'ref_no': refNo,
    };
  }

  factory CashMovementModel.fromMap(Map<String, dynamic> map) {
    return CashMovementModel(
      id: map['id'] as String,
      date: DateTime.tryParse(map['date']?.toString() ?? '') ?? DateTime.now(),
      type: map['type'] == 'expense' ? CashType.expense : CashType.income,
      amount: (map['amount'] as num).toInt(),
      category: map['category'] as String,
      notes: (map['notes'] ?? '') as String,
      refNo: map['ref_no'] as String?,
    );
  }
}
