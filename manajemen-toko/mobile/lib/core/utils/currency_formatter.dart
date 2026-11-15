import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _formatter = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  static final NumberFormat _plainNumberFormatter = NumberFormat.decimalPattern('id_ID');

  /// Format angka ke Rupiah penuh: 15000 -> "Rp 15.000"
  static String formatRupiah(num amount) {
    return _formatter.format(amount);
  }

  /// Format angka tanpa simbol "Rp": 15000 -> "15.000"
  static String formatNumber(num amount) {
    return _plainNumberFormatter.format(amount);
  }

  /// Parse string berpemisah titik ke integer murni: "15.000" -> 15000
  static int parseClean(String text) {
    final clean = text.replaceAll(RegExp(r'[^0-9]'), '');
    return int.tryParse(clean) ?? 0;
  }
}

/// Formatter otomatis saat mengetik angka: "15000" otomatis jadi "15.000"
class ThousandSeparatorInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Bersihkan karakter non-digit
    final cleanText = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (cleanText.isEmpty) {
      return const TextEditingValue(text: '');
    }

    final number = int.tryParse(cleanText) ?? 0;
    final formatted = CurrencyFormatter.formatNumber(number);

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
