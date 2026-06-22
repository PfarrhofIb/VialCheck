import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Ablaufdatum nur als Monat/Jahr (Speicherformat: `yyyy-MM`).
class ExpiryDateUtils {
  ExpiryDateUtils._();

  static DateTime monthStart(String value) {
    final parts = value.split('-');
    final year = int.parse(parts[0]);
    final month = int.parse(parts[1]);
    return DateTime(year, month);
  }

  /// Letzter Tag des Ablaufmonats (Ampullen: gültig bis Monatsende).
  static DateTime monthEnd(String value) {
    final start = monthStart(value);
    return DateTime(start.year, start.month + 1, 0);
  }

  static String toStorage(DateTime monthYear) =>
      DateFormat('yyyy-MM').format(DateTime(monthYear.year, monthYear.month));

  static String toDisplay(String value) =>
      DateFormat('MM.yyyy').format(monthStart(value));

  static int daysUntilMonthEnd(String value) {
    final end = monthEnd(value);
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    return end.difference(todayDate).inDays;
  }

  static bool isExpired(String value) => daysUntilMonthEnd(value) < 0;

  static bool isExpiringSoon(String value) {
    final days = daysUntilMonthEnd(value);
    return days >= 0 && days < 30;
  }

  static const _germanMonths = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  static Future<DateTime?> pickMonthYear(
    BuildContext context, {
    DateTime? initial,
  }) async {
    final now = DateTime.now();
    var selectedMonth = initial?.month ?? now.month;
    var selectedYear = initial?.year ?? now.year;

    return showDialog<DateTime>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return AlertDialog(
              title: const Text('Ablaufmonat wählen'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    value: selectedMonth,
                    decoration: const InputDecoration(labelText: 'Monat'),
                    items: List.generate(12, (i) {
                      final month = i + 1;
                      return DropdownMenuItem(
                        value: month,
                        child: Text(_germanMonths[i]),
                      );
                    }),
                    onChanged: (v) {
                      if (v != null) setState(() => selectedMonth = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: selectedYear,
                    decoration: const InputDecoration(labelText: 'Jahr'),
                    items: List.generate(16, (i) {
                      final year = now.year - 1 + i;
                      return DropdownMenuItem(
                        value: year,
                        child: Text('$year'),
                      );
                    }),
                    onChanged: (v) {
                      if (v != null) setState(() => selectedYear = v);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Abbrechen'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(
                    ctx,
                    DateTime(selectedYear, selectedMonth),
                  ),
                  child: const Text('OK'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
