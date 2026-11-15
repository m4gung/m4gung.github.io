import 'package:flutter/material.dart';
import '../core/widgets/adaptive_layout.dart';
import '../features/cashbook/presentation/cashbook_screen.dart';
import '../features/debts/presentation/debt_list_screen.dart';
import '../features/pos/presentation/pos_screen.dart';
import '../features/products/presentation/product_list_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

class HomeNavigationScreen extends StatefulWidget {
  const HomeNavigationScreen({super.key});

  @override
  State<HomeNavigationScreen> createState() => _HomeNavigationScreenState();
}

class _HomeNavigationScreenState extends State<HomeNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    PosScreen(),
    ProductListScreen(),
    DebtListScreen(),
    CashbookScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isTablet = AdaptiveLayout.isTablet(context);

    if (isTablet) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) {
                setState(() => _currentIndex = index);
              },
              labelType: NavigationRailLabelType.all,
              backgroundColor: Colors.white,
              indicatorColor: const Color(0xFFD1FAE5),
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.storefront, color: Colors.white, size: 24),
                ),
              ),
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.point_of_sale_outlined),
                  selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFF047857)),
                  label: Text('Kasir'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.inventory_2_outlined),
                  selectedIcon: Icon(Icons.inventory_2, color: Color(0xFF047857)),
                  label: Text('Produk'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  selectedIcon: Icon(Icons.account_balance_wallet, color: Color(0xFF047857)),
                  label: Text('Hutang'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF047857)),
                  label: Text('Buku Kas'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.settings_outlined),
                  selectedIcon: Icon(Icons.settings, color: Color(0xFF047857)),
                  label: Text('Atur'),
                ),
              ],
            ),
            const VerticalDivider(width: 1, thickness: 1, color: Color(0xFFE2E8F0)),
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: _screens,
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFD1FAE5),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.point_of_sale_outlined),
            selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFF047857)),
            label: 'Kasir',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: Color(0xFF047857)),
            label: 'Produk',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet, color: Color(0xFF047857)),
            label: 'Hutang',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF047857)),
            label: 'Buku Kas',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings, color: Color(0xFF047857)),
            label: 'Pengaturan',
          ),
        ],
      ),
    );
  }
}
