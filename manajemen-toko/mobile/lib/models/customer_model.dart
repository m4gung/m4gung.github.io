class CustomerModel {
  final String id;
  final String name;
  final String phone;
  final String address;
  final int creditLimit;
  final int currentDebt;
  final DateTime updatedAt;

  const CustomerModel({
    required this.id,
    required this.name,
    this.phone = '',
    this.address = '',
    this.creditLimit = 1000000,
    this.currentDebt = 0,
    required this.updatedAt,
  });

  bool get isOverLimit => creditLimit > 0 && currentDebt >= creditLimit;
  int get remainingCredit => (creditLimit - currentDebt).clamp(0, creditLimit);

  CustomerModel copyWith({
    String? id,
    String? name,
    String? phone,
    String? address,
    int? creditLimit,
    int? currentDebt,
    DateTime? updatedAt,
  }) {
    return CustomerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      creditLimit: creditLimit ?? this.creditLimit,
      currentDebt: currentDebt ?? this.currentDebt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'address': address,
      'credit_limit': creditLimit,
      'current_debt': currentDebt,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory CustomerModel.fromMap(Map<String, dynamic> map) {
    return CustomerModel(
      id: map['id'] as String,
      name: map['name'] as String,
      phone: (map['phone'] ?? '') as String,
      address: (map['address'] ?? '') as String,
      creditLimit: (map['credit_limit'] as num?)?.toInt() ?? 0,
      currentDebt: (map['current_debt'] as num?)?.toInt() ?? 0,
      updatedAt: DateTime.tryParse(map['updated_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
