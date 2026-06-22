import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/refill_item.dart';
import '../providers/medication_provider.dart';
import '../theme/app_theme.dart';
import '../utils/expiry_date_utils.dart';

class RefillScreen extends StatelessWidget {
  const RefillScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nachfüllen'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Aktualisieren',
            onPressed: () =>
                context.read<MedicationProvider>().loadRefillList(),
          ),
        ],
      ),
      body: Consumer<MedicationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.refillList.isEmpty) {
            return _EmptyRefillState();
          }
          return RefreshIndicator(
            onRefresh: () => provider.loadRefillList(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.refillList.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                return _RefillCard(item: provider.refillList[index]);
              },
            ),
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Refill Card
// ──────────────────────────────────────────────

class _RefillCard extends StatelessWidget {
  const _RefillCard({required this.item});
  final RefillItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Menge-Badge
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.dangerLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${item.amountNeeded}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.danger,
                    ),
                  ),
                  const Text(
                    'Stk.',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.danger,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            // Name
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.medicationName ?? 'Unbekannt',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Benötigt zum Auffüllen',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Aufgefüllt-Button
            FilledButton(
              onPressed: () => _showRefilledDialog(context, item),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.success,
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                minimumSize: const Size(0, 40),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_rounded, size: 18),
                  SizedBox(height: 2),
                  Text(
                    'Aufgefüllt',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRefilledDialog(BuildContext context, RefillItem item) {
    showDialog(
      context: context,
      builder: (ctx) => _RefilledDialog(item: item),
    );
  }
}

// ──────────────────────────────────────────────
// Dialog: Aufgefüllt?
// ──────────────────────────────────────────────

class _RefilledDialog extends StatefulWidget {
  const _RefilledDialog({required this.item});
  final RefillItem item;

  @override
  State<_RefilledDialog> createState() => _RefilledDialogState();
}

class _RefilledDialogState extends State<_RefilledDialog> {
  bool _restockInventory = true;
  late int _restockAmount;
  DateTime? _expiryDate;

  @override
  void initState() {
    super.initState();
    _restockAmount = widget.item.amountNeeded;
  }

  Future<void> _pickExpiry() async {
    final picked = await ExpiryDateUtils.pickMonthYear(
      context,
      initial: _expiryDate,
    );
    if (picked != null) setState(() => _expiryDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.item.medicationName ?? 'Medikament',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Wurde "${widget.item.medicationName}" aufgefüllt?',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          // Toggle: Bestand erhöhen?
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: SwitchListTile.adaptive(
              value: _restockInventory,
              onChanged: (v) => setState(() => _restockInventory = v),
              title: const Text(
                'Bestand im Inventar erhöhen',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              activeColor: AppColors.success,
            ),
          ),
          if (_restockInventory) ...[
            const SizedBox(height: 12),
            Text(
              'Menge hinzufügen:',
              style: theme.textTheme.labelMedium?.copyWith(
                color: AppColors.neutral,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.outlined(
                  onPressed: _restockAmount > 1
                      ? () => setState(() => _restockAmount--)
                      : null,
                  icon: const Icon(Icons.remove_rounded),
                ),
                const SizedBox(width: 16),
                Container(
                  width: 64,
                  alignment: Alignment.center,
                  child: Text(
                    '$_restockAmount',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                IconButton.outlined(
                  onPressed: () => setState(() => _restockAmount++),
                  icon: const Icon(Icons.add_rounded),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today_outlined),
              title: Text(
                _expiryDate == null
                    ? 'Ablaufmonat der neuen Charge *'
                    : ExpiryDateUtils.toDisplay(
                        ExpiryDateUtils.toStorage(_expiryDate!),
                      ),
              ),
              subtitle: const Text('MHD der nachgefüllten Ampullen'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: _pickExpiry,
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Abbrechen'),
        ),
        FilledButton.icon(
          onPressed: () async {
            if (_restockInventory && _expiryDate == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Bitte den Ablaufmonat der neuen Charge wählen.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
              return;
            }

            final provider = context.read<MedicationProvider>();
            final expiry = _expiryDate != null
                ? ExpiryDateUtils.toStorage(_expiryDate!)
                : null;
            await provider.markAsRefilled(
              widget.item,
              restockAmount: _restockInventory ? _restockAmount : null,
              expiryDate: expiry,
            );
            if (context.mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_restockInventory
                      ? '${widget.item.medicationName}: $_restockAmount× ${ExpiryDateUtils.toDisplay(expiry!)} zum Bestand hinzugefügt.'
                      : '${widget.item.medicationName} aus der Nachfüllliste entfernt.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
          icon: const Icon(Icons.check_rounded, size: 18),
          label: const Text('Bestätigen'),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.success,
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────

class _EmptyRefillState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_outlined,
              size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'Keine Nachfüllungen\nerforderlich',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 17,
              color: Colors.grey.shade500,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Super! Alle Bestände sind ausreichend.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }
}
