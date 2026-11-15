import 'package:flutter/services.dart';

class AudioFeedbackService {
  /// Getaran halus saat barang berhasil dimasukkan ke keranjang kasir
  static void itemAdded() {
    HapticFeedback.lightImpact();
  }

  /// Getaran sedang khas Taptic Engine iPhone saat menekan uang pas / kategori
  static void selectionTap() {
    HapticFeedback.selectionClick();
  }

  /// Getaran menengah saat scan barcode berhasil
  static void scanSuccess() {
    HapticFeedback.mediumImpact();
    SystemSound.play(SystemSoundType.click);
  }

  /// Getaran tegas saat transaksi pembayaran sukses
  static void paymentSuccess() {
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.click);
  }

  /// Getaran peringatan (misal stok habis atau limit hutang tercapai)
  static void alertError() {
    HapticFeedback.vibrate();
  }
}
