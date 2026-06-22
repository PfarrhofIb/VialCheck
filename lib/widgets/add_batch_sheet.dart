import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/medication.dart';
import '../providers/medication_provider.dart';
import '../theme/app_theme.dart';
import '../utils/expiry_date_utils.dart';
import '../utils/sheet_utils.dart';

Future<void> showAddBatchSheet(
  BuildContext context,
  Medication medication, {
  DateTime? initialExpiry,
  int initialQuantity = 1,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => _AddBatchSheet(
      medication: medication,
      initialExpiry: initialExpiry,
      initialQuantity: initialQuantity,
    ),
  );
}

class _AddBatchSheet extends StatefulWidget {
  const _AddBatchSheet({
    required this.medication,
    this.initialExpiry,
    this.initialQuantity = 1,
  });

  final Medication medication;
  final DateTime? initialExpiry;
  final int initialQuantity;

  @override
  State<_AddBatchSheet> createState() => _AddBatchSheetState();
}

class _AddBatchSheetState extends State<_AddBatchSheet> {
  final _quantityCtrl = TextEditingController();
  DateTime? _expiryDate;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _quantityCtrl.text = widget.initialQuantity.toString();
    _expiryDate = widget.initialExpiry;
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await ExpiryDateUtils.pickMonthYear(
      context,
      initial: _expiryDate,
    );
    if (picked != null) setState(() => _expiryDate = picked);
  }

  Future<void> _save() async {
    final qty = int.tryParse(_quantityCtrl.text);
    if (qty == null || qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bitte eine gültige Ampullenanzahl eingeben.')),
      );
      return;
    }
    if (_expiryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bitte einen Ablaufmonat wählen.')),
      );
      return;
    }

    setState(() => _saving = true);
    await context.read<MedicationProvider>().addBatch(
          widget.medication,
          ExpiryDateUtils.toStorage(_expiryDate!),
          qty,
        );
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${widget.medication.name}: $qty× ${ExpiryDateUtils.toDisplay(ExpiryDateUtils.toStorage(_expiryDate!))} hinzugefügt.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return sheetSafePadding(
      context: context,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Charge hinzufügen',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.medication.name,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral,
                ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _quantityCtrl,
            decoration: const InputDecoration(
              labelText: 'Ampullenanzahl *',
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.calendar_today_outlined),
            title: Text(
              _expiryDate == null
                  ? 'Ablaufmonat wählen *'
                  : ExpiryDateUtils.toDisplay(
                      ExpiryDateUtils.toStorage(_expiryDate!),
                    ),
            ),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: _pickDate,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Charge speichern'),
            ),
          ),
        ],
      ),
    );
  }
}
