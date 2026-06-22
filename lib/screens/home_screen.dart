import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/medication_provider.dart';
import 'inventory_screen.dart';
import 'refill_screen.dart';
import 'scanner_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  static const _screens = [
    InventoryScreen(),
    ScannerScreen(),
    RefillScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Consumer<MedicationProvider>(
        builder: (context, provider, _) {
          final refillCount = provider.refillList.length;
          return BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.medication_outlined),
                activeIcon: Icon(Icons.medication),
                label: 'Bestand',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.qr_code_scanner_outlined),
                activeIcon: Icon(Icons.qr_code_scanner),
                label: 'Scanner',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  isLabelVisible: refillCount > 0,
                  label: Text('$refillCount'),
                  child: const Icon(Icons.inventory_2_outlined),
                ),
                activeIcon: Badge(
                  isLabelVisible: refillCount > 0,
                  label: Text('$refillCount'),
                  child: const Icon(Icons.inventory_2),
                ),
                label: 'Nachfüllen',
              ),
            ],
          );
        },
      ),
    );
  }
}
