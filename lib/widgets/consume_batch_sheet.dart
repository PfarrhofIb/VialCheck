import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/medication.dart';
import '../models/medication_batch.dart';
import '../providers/medication_provider.dart';
import '../theme/app_theme.dart';
import '../utils/sheet_utils.dart';

Future<void> showConsumeBatchSheet(
  BuildContext context,
  Medication medication,
) {
  final batches = medication.sortedBatches.where((b) => b.quantity > 0).toList();
  if (batches.isEmpty) return Future.value();

  return showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => _ConsumeBatchSheet(
      medication: medication,
      batches: batches,
    ),
  );
}

class _ConsumeBatchSheet extends StatefulWidget {
  const _ConsumeBatchSheet({
    required this.medication,
    required this.batches,
  });

  final Medication medication;
  final List<MedicationBatch> batches;

  @override
  State<_ConsumeBatchSheet> createState() => _ConsumeBatchSheetState();
}

class _ConsumeBatchSheetState extends State<_ConsumeBatchSheet> {
  bool _consuming = false;

  Future<void> _consume(MedicationBatch batch) async {
    if (_consuming) return;
    setState(() => _consuming = true);

    final ok = await context.read<MedicationProvider>().consumeOne(
          widget.medication,
          batch.expiryDate,
        );

    if (!mounted) return;
    Navigator.pop(context);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${widget.medication.name}: 1× ${batch.displayExpiry} verbraucht.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verbrauch fehlgeschlagen – Charge evtl. leer.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return sheetSafePadding(
      context: context,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Welche Charge wurde verbraucht?',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.medication.name,
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.neutral,
            ),
          ),
          const SizedBox(height: 16),
          ...widget.batches.map((batch) {
            final expired = batch.isExpired;
            final expiringSoon = batch.isExpiringSoon;
            Color color;
            if (expired) {
              color = AppColors.danger;
            } else if (expiringSoon) {
              color = AppColors.warning;
            } else {
              color = AppColors.success;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                enabled: !_consuming,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: color.withValues(alpha: 0.35)),
                ),
                tileColor: color.withValues(alpha: 0.08),
                leading: Icon(Icons.medication_liquid, color: color),
                title: Text(
                  batch.displayExpiry,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text('${batch.quantity} Ampulle(n) auf Lager'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => _consume(batch),
              ),
            );
          }),
          if (_consuming)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
