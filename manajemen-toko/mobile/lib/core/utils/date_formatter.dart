import 'package:intl/intl.dart';

class DateFormatter {
  static String formatShortDateTime(DateTime dateTime) {
    return DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(dateTime);
  }

  static String formatDateOnly(DateTime dateTime) {
    return DateFormat('d MMMM yyyy', 'id_ID').format(dateTime);
  }

  static String formatTimeOnly(DateTime dateTime) {
    return DateFormat('HH:mm', 'id_ID').format(dateTime);
  }

  static String toIsoDateString(DateTime dateTime) {
    return dateTime.toIso8601String();
  }
}
