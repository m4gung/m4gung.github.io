import 'package:flutter/material.dart';

/// Breakpoint standar Material 3 untuk membedakan HP dan Tablet/iPad.
class AdaptiveLayout {
  static const double tabletBreakpoint = 600.0;
  static const double expandedBreakpoint = 900.0;

  static bool isTablet(BuildContext context) {
    return MediaQuery.sizeOf(context).width >= tabletBreakpoint;
  }

  static bool isExpanded(BuildContext context) {
    return MediaQuery.sizeOf(context).width >= expandedBreakpoint;
  }

  /// Menghitung jumlah kolom grid katalog berdasarkan lebar area yang tersedia.
  static int catalogGridColumns(double availableWidth) {
    if (availableWidth >= 1200) return 6;
    if (availableWidth >= 980) return 5;
    if (availableWidth >= 740) return 4;
    if (availableWidth >= 520) return 3;
    return 2;
  }
}

/// Widget pembangun layout adaptif antara mode HP dan Tablet.
class AdaptiveBuilder extends StatelessWidget {
  final WidgetBuilder mobile;
  final WidgetBuilder tablet;

  const AdaptiveBuilder({
    super.key,
    required this.mobile,
    required this.tablet,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= AdaptiveLayout.tabletBreakpoint) {
          return tablet(context);
        }
        return mobile(context);
      },
    );
  }
}
