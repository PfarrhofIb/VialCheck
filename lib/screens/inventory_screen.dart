import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/medication.dart';
import '../models/medication_batch.dart';
import '../providers/medication_provider.dart';
import '../services/ampule_photo_service.dart';
import '../theme/app_theme.dart';
import '../utils/concentration_parser.dart';
import '../utils/number_parse_utils.dart';
import '../widgets/medication_photo_section.dart';
import '../widgets/consume_batch_sheet.dart';
import '../widgets/add_batch_sheet.dart';
import '../widgets/ampule_capture_flow.dart';
import '../widgets/medication_concentration_fields.dart';
import '../widgets/medication_form_sheet.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _photoService = AmpulePhotoService();

  @override
  void dispose() {
    _photoService.dispose();
    super.dispose();
  }

  void _showAddOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.dangerLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.edit_note_rounded,
                      color: AppColors.danger),
                ),
                title: const Text('Manuell eingeben'),
                subtitle: const Text(
                    'Name, MHD und Bestand ohne Barcode – z. B. Ampullen'),
                onTap: () {
                  Navigator.pop(ctx);
                  showMedicationFormSheet(
                    context,
                    source: MedicationFormSource.manual,
                  );
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_camera_outlined,
                      color: AppColors.success),
                ),
                title: const Text('Ampulle fotografieren'),
                subtitle: const Text(
                    'Etikett fotografieren, Text automatisch erkennen'),
                onTap: () {
                  Navigator.pop(ctx);
                  captureAmpuleAndOpenForm(context, _photoService);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bestand'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Aktualisieren',
            onPressed: () =>
                context.read<MedicationProvider>().loadMedications(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddOptions,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Hinzufügen'),
      ),
      body: Consumer<MedicationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.medications.isEmpty) {
            return _EmptyState(onAdd: _showAddOptions);
          }
          return RefreshIndicator(
            onRefresh: () => provider.loadMedications(),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: provider.medications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                return _MedicationCard(
                  medication: provider.medications[index],
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _MedicationCard extends StatelessWidget {
  const _MedicationCard({required this.medication});
  final Medication medication;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totalQty = medication.totalQuantity;
    final concentrationLabel = ConcentrationParser.formatLabel(
      medication.mlPerAmpule,
      medication.mgPerMl,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (medication.photoPath != null &&
                    File(medication.photoPath!).existsSync())
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        File(medication.photoPath!),
                        width: 52,
                        height: 52,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        medication.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (medication.isManual) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.neutralLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Manuell / Ampulle',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.neutral,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                _QuantityBadge(quantity: totalQty),
              ],
            ),
            if (concentrationLabel != null) ...[
              const SizedBox(height: 8),
              Text(
                concentrationLabel,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
            const SizedBox(height: 10),
            _BatchList(batches: medication.sortedBatches),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => showAddBatchSheet(context, medication),
                icon: const Icon(Icons.add_circle_outline, size: 18),
                label: const Text('Charge hinzufügen'),
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: _ConsumeButton(medication: medication),
                ),
                const SizedBox(width: 8),
                _EditButton(medication: medication),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BatchList extends StatelessWidget {
  const _BatchList({required this.batches});
  final List<MedicationBatch> batches;

  @override
  Widget build(BuildContext context) {
    final visible = batches.where((b) => b.quantity > 0).toList();
    if (visible.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.dangerLight,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'Kein Bestand vorhanden',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.danger,
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: visible.map((batch) {
        final expired = batch.isExpired;
        final expiringSoon = batch.isExpiringSoon;
        Color color;
        Color bg;
        if (expired) {
          color = AppColors.danger;
          bg = AppColors.dangerLight;
        } else if (expiringSoon) {
          color = AppColors.warning;
          bg = AppColors.warningLight;
        } else {
          color = AppColors.success;
          bg = AppColors.successLight;
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  expired
                      ? Icons.error_rounded
                      : expiringSoon
                          ? Icons.warning_amber_rounded
                          : Icons.check_circle_outline,
                  size: 14,
                  color: color,
                ),
                const SizedBox(width: 6),
                Text(
                  '${batch.quantity}× ${batch.displayExpiry}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _QuantityBadge extends StatelessWidget {
  const _QuantityBadge({required this.quantity});
  final int quantity;

  @override
  Widget build(BuildContext context) {
    final isLow = quantity <= 2;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isLow ? AppColors.dangerLight : AppColors.neutralLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isLow
              ? AppColors.danger.withValues(alpha: 0.4)
              : Colors.transparent,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLow)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.warning_rounded,
                  size: 13, color: AppColors.danger),
            ),
          Text(
            '$quantity Stk.',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isLow ? AppColors.danger : AppColors.neutral,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsumeButton extends StatelessWidget {
  const _ConsumeButton({required this.medication});
  final Medication medication;

  @override
  Widget build(BuildContext context) {
    final total = medication.totalQuantity;
    return FilledButton.icon(
      onPressed: total > 0
          ? () => showConsumeBatchSheet(context, medication)
          : null,
      icon: const Icon(Icons.remove_circle_outline, size: 18),
      label: const Text('1 Verbraucht'),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.danger,
        disabledBackgroundColor: AppColors.neutralLight,
        minimumSize: const Size(0, 42),
      ),
    );
  }
}

class _EditButton extends StatelessWidget {
  const _EditButton({required this.medication});
  final Medication medication;

  @override
  Widget build(BuildContext context) {
    return IconButton.outlined(
      onPressed: () => _showEditDialog(context, medication),
      icon: const Icon(Icons.edit_outlined, size: 20),
      tooltip: 'Bearbeiten',
      style: IconButton.styleFrom(
        side: const BorderSide(color: Color(0xFFDDDDDD)),
      ),
    );
  }

  void _showEditDialog(BuildContext context, Medication med) {
    showDialog(
      context: context,
      builder: (ctx) => _EditMedicationDialog(medication: med),
    );
  }
}

class _EditMedicationDialog extends StatefulWidget {
  const _EditMedicationDialog({required this.medication});
  final Medication medication;

  @override
  State<_EditMedicationDialog> createState() => _EditMedicationDialogState();
}

class _EditMedicationDialogState extends State<_EditMedicationDialog> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _mlCtrl;
  late final TextEditingController _mgPerMlCtrl;
  String? _photoPath;
  bool _photoRemoved = false;

  @override
  void initState() {
    super.initState();
    _photoPath = widget.medication.photoPath;
    _nameCtrl = TextEditingController(text: widget.medication.name);
    _mlCtrl = TextEditingController(
      text: NumberParseUtils.formatOptionalDouble(
            widget.medication.mlPerAmpule) ??
          '',
    );
    _mgPerMlCtrl = TextEditingController(
      text: NumberParseUtils.formatOptionalDouble(widget.medication.mgPerMl) ??
          '',
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mlCtrl.dispose();
    _mgPerMlCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Medikament bearbeiten'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name'),
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 12),
            MedicationConcentrationFields(
              mlController: _mlCtrl,
              mgPerMlController: _mgPerMlCtrl,
            ),
            const SizedBox(height: 16),
            MedicationPhotoSection(
              photoPath: _photoPath,
              onChanged: (path) => setState(() {
                _photoPath = path;
                _photoRemoved = path == null;
              }),
            ),
            const SizedBox(height: 16),
            Text(
              'Chargen (Bestand pro MHD)',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            _BatchList(batches: widget.medication.sortedBatches),
            const SizedBox(height: 8),
            Text(
              'Neue Chargen über „Charge hinzufügen“ in der Liste erfassen.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.neutral,
                  ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Abbrechen'),
        ),
        FilledButton(
          onPressed: () async {
            final updated = widget.medication.copyWith(
              name: _nameCtrl.text.trim(),
              photoPath: _photoRemoved ? null : _photoPath,
              clearPhotoPath: _photoRemoved && _photoPath == null,
              mlPerAmpule: NumberParseUtils.parseOptionalDouble(_mlCtrl.text),
              mgPerMl: NumberParseUtils.parseOptionalDouble(_mgPerMlCtrl.text),
              clearMlPerAmpule: _mlCtrl.text.trim().isEmpty,
              clearMgPerMl: _mgPerMlCtrl.text.trim().isEmpty,
            );
            await context
                .read<MedicationProvider>()
                .updateMedication(updated);
            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Speichern'),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.medication_outlined,
                size: 72, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'Noch keine Medikamente\nim Bestand',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ampullen ohne Barcode kannst du manuell\neingeben oder per Foto erfassen.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Medikament hinzufügen'),
            ),
          ],
        ),
      ),
    );
  }
}
