import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/services/audio_feedback_service.dart';
import '../../../models/customer_model.dart';
import '../../../models/product_model.dart';
import '../../../models/sale_model.dart';

class CartItem {
  final ProductModel product;
  final int quantity;

  CartItem({required this.product, required this.quantity});

  int get subtotal => product.sellingPrice * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }
}

class PosState {
  final Map<String, CartItem> items;
  final CustomerModel? customer;
  final int discount;

  const PosState({
    this.items = const {},
    this.customer,
    this.discount = 0,
  });

  int get totalItemCount => items.values.fold(0, (sum, i) => sum + i.quantity);
  int get totalAmount => items.values.fold(0, (sum, i) => sum + i.subtotal);
  int get finalAmount => (totalAmount - discount).clamp(0, totalAmount);
  bool get isEmpty => items.isEmpty;

  PosState copyWith({
    Map<String, CartItem>? items,
    CustomerModel? customer,
    int? discount,
  }) {
    return PosState(
      items: items ?? this.items,
      customer: customer ?? this.customer,
      discount: discount ?? this.discount,
    );
  }
}

class PosNotifier extends Notifier<PosState> {
  @override
  PosState build() {
    return const PosState();
  }

  void addToCart(ProductModel product) {
    if (product.stock <= 0) {
      AudioFeedbackService.alertError();
      return;
    }

    final currentItem = state.items[product.id];
    final currentQty = currentItem?.quantity ?? 0;

    if (currentQty >= product.stock) {
      AudioFeedbackService.alertError();
      return;
    }

    final newItems = Map<String, CartItem>.from(state.items);
    newItems[product.id] = CartItem(
      product: product,
      quantity: currentQty + 1,
    );

    state = state.copyWith(items: newItems);
    AudioFeedbackService.itemAdded();
  }

  void decrementQuantity(String productId) {
    final currentItem = state.items[productId];
    if (currentItem == null) return;

    final newItems = Map<String, CartItem>.from(state.items);
    if (currentItem.quantity <= 1) {
      newItems.remove(productId);
    } else {
      newItems[productId] = currentItem.copyWith(quantity: currentItem.quantity - 1);
    }

    state = state.copyWith(items: newItems);
    AudioFeedbackService.itemAdded();
  }

  void removeFromCart(String productId) {
    final newItems = Map<String, CartItem>.from(state.items);
    newItems.remove(productId);
    state = state.copyWith(items: newItems);
  }

  void clearCart() {
    state = const PosState();
  }

  void setCustomer(CustomerModel? customer) {
    state = state.copyWith(customer: customer);
  }

  void setDiscount(int discount) {
    state = state.copyWith(discount: discount);
  }

  Future<bool> scanBarcode(String code) async {
    final product = await AppDatabase.instance.getProductByBarcode(code);
    if (product != null) {
      addToCart(product);
      return true;
    } else {
      AudioFeedbackService.alertError();
      return false;
    }
  }

  Future<SaleModel> processCheckout({
    required PaymentMethod paymentMethod,
    required int cashReceived,
  }) async {
    final invoiceNo = await AppDatabase.instance.generateNextInvoiceNo();
    const uuid = Uuid();

    final saleItems = state.items.values.map((cartItem) {
      return SaleItemModel(
        id: uuid.v4(),
        invoiceNo: invoiceNo,
        productId: cartItem.product.id,
        productName: cartItem.product.name,
        costPrice: cartItem.product.costPrice,
        sellingPrice: cartItem.product.sellingPrice,
        quantity: cartItem.quantity,
        subtotal: cartItem.subtotal,
      );
    }).toList();

    int changeAmount = 0;
    if (paymentMethod == PaymentMethod.cash) {
      changeAmount = (cashReceived - state.finalAmount).clamp(0, cashReceived);
    }

    final sale = SaleModel(
      invoiceNo: invoiceNo,
      date: DateTime.now(),
      customerName: state.customer?.name ?? 'Pelanggan Umum',
      customerId: state.customer?.id,
      totalAmount: state.totalAmount,
      discount: state.discount,
      finalAmount: state.finalAmount,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod == PaymentMethod.cash ? cashReceived : state.finalAmount,
      changeAmount: changeAmount,
      paymentStatus: paymentMethod == PaymentMethod.credit ? 'UNPAID' : 'PAID',
      dueDate: paymentMethod == PaymentMethod.credit
          ? DateTime.now().add(const Duration(days: 30))
          : null,
      items: saleItems,
    );

    await AppDatabase.instance.saveTransaction(sale);
    AudioFeedbackService.paymentSuccess();
    clearCart();

    return sale;
  }
}

final posProvider = NotifierProvider<PosNotifier, PosState>(PosNotifier.new);
