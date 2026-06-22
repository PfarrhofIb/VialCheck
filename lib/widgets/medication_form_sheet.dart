import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/medication_provider.dart';
import '../theme/app_theme.dart';
import '../utils/expiry_date_utils.dart';
import '../utils/medication_barcode.dart';
import '../utils/number_parse_utils.dart';
import '../utils/sheet_utils.dart';
import 'medication_concentration_fields.dart';
import 'medication_photo_section.dart';

enum MedicationFormSource { manual, barcode, photo }

Future<void> showMedicationFormSheet(
  BuildContext context, {
  String? barcode,
  String? initialName,
  DateTime? initialExpiry,
  int initialQuantity = 1,
  double? initialMlPerAmpule,
  double? initialMgPerMl,
  String? photoPath,
  String? ocrPreviewText,
  MedicationFormSource source = MedicationFormSource.manual,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => MedicationFormSheet(
      barcode: barcode ?? generateManualBarcode(),
      initialName: initialName,
      initialExpiry: initialExpiry,
      initialQuantity: initialQuantity,
      initialMlPerAmpule: initialMlPerAmpule,
      initialMgPerMl: initialMgPerMl,
      photoPath: photoPath,
      ocrPreviewText: ocrPreviewText,
      source: source,
    ),
  );
}

class MedicationFormSheet extends StatefulWidget {
  const MedicationFormSheet({
    super.key,
    required this.barcode,
    this.initialName,
    this.initialExpiry,
    this.initialQuantity = 1,
    this.initialMlPerAmpule,
    this.initialMgPerMl,
    this.photoPath,
    this.ocrPreviewText,
    this.source = MedicationFormSource.manual,
  });

  final String barcode;
  final String? initialName;
  final DateTime? initialExpiry;
  final int initialQuantity;
  final double? initialMlPerAmpule;
  final double? initialMgPerMl;
  final String? photoPath;
  final String? ocrPreviewText;
  final MedicationFormSource source;

  @override
  State<MedicationFormSheet> createState() => _MedicationFormSheetState();
}

class _MedicationFormSheetState extends State<MedicationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _quantityCtrl;
  late final TextEditingController _mlCtrl;
  late final TextEditingController _mgPerMlCtrl;
  DateTime? _expiryDate;
  bool _saving = false;
  String? _photoPath;
  String? _ocrPreviewText;
  bool _photoRemoved = false;

  @override
  void initState() {
    super.initState();
    _photoPath = widget.photoPath;
    _ocrPreviewText = widget.ocrPreviewText;
    _nameCtrl = TextEditingController(text: widget.initialName ?? '');
    _quantityCtrl =
        TextEditingController(text: widget.initialQuantity.toString());
    _mlCtrl = TextEditingController(
      text: NumberParseUtils.formatOptionalDouble(widget.initialMlPerAmpule) ??
          '',
    );
    _mgPerMlCtrl = TextEditingController(
      text: NumberParseUtils.formatOptionalDouble(widget.initialMgPerMl) ?? '',
    );
    _expiryDate = widget.initialExpiry;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _quantityCtrl.dispose();
    _mlCtrl.dispose();
    _mgPerMlCtrl.dispose();
    super.dispose();
  }

  String get _title {
    switch (widget.source) {
      case MedicationFormSource.photo:
        return 'Aus Foto erfassen';
      case MedicationFormSource.barcode:
        return 'Neues Medikament';
      case MedicationFormSource.manual:
        return 'Manuell hinzufügen';
    }
  }

  String get _subtitle {
    switch (widget.source) {
      case MedicationFormSource.photo:
        return 'Erkannte Daten prüfen und anpassen';
      case MedicationFormSource.barcode:
        return 'Barcode: ${widget.barcode.length > 28 ? '${widget.barcode.substring(0, 28)}…' : widget.barcode}';
      case MedicationFormSource.manual:
        return 'Ohne Barcode – z. B. für Ampullen';
    }
  }

  IconData get _headerIcon {
    switch (widget.source) {
      case MedicationFormSource.photo:
        return Icons.document_scanner_outlined;
      case MedicationFormSource.barcode:
        return Icons.qr_code_scanner;
      case MedicationFormSource.manual:
        return Icons.edit_note_rounded;
    }
  }

  Color get _headerColor {
    switch (widget.source) {
      case MedicationFormSource.photo:
        return AppColors.success;
      case MedicationFormSource.barcode:
        return AppColors.warning;
      case MedicationFormSource.manual:
        return AppColors.danger;
    }
  }

  Future<void> _pickDate() async {
    final picked = await ExpiryDateUtils.pickMonthYear(
      context,
      initial: _expiryDate,
    );
    if (picked != null) setState(() => _expiryDate = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_expiryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bitte einen Ablaufmonat wählen.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _saving = true);

    final name = _nameCtrl.text.trim();
    final expiry = ExpiryDateUtils.toStorage(_expiryDate!);
    final quantity = int.tryParse(_quantityCtrl.text) ?? 1;

    await context.read<MedicationProvider>().saveMedicationEntry(
          barcode: widget.barcode,
          name: name,
          expiryDate: expiry,
          quantity: quantity,
          photoPath: _photoPath,
          removePhoto: _photoRemoved && _photoPath == null,
          mlPerAmpule: NumberParseUtils.parseOptionalDouble(_mlCtrl.text),
          mgPerMl: NumberParseUtils.parseOptionalDouble(_mgPerMlCtrl.text),
        );

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$name: $quantity× ${ExpiryDateUtils.toDisplay(expiry)} gespeichert.'),
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
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _headerColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_headerIcon, color: _headerColor),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          _subtitle,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              MedicationPhotoSection(
                photoPath: _photoPath,
                onChanged: (path) => setState(() {
                  _photoPath = path;
                  _photoRemoved = path == null;
                  if (path == null) _ocrPreviewText = null;
                }),
                onOcrResult: (result) => setState(() {
                  _ocrPreviewText = result.rawText;
                  if (result.suggestedName != null &&
                      result.suggestedName!.isNotEmpty &&
                      _nameCtrl.text.trim().isEmpty) {
                    _nameCtrl.text = result.suggestedName!;
                  }
                  if (result.suggestedExpiry != null) {
                    _expiryDate = result.suggestedExpiry;
                  }
                  if (result.suggestedMlPerAmpule != null &&
                      _mlCtrl.text.trim().isEmpty) {
                    _mlCtrl.text = NumberParseUtils.formatOptionalDouble(
                          result.suggestedMlPerAmpule) ??
                        '';
                  }
                  if (result.suggestedMgPerMl != null &&
                      _mgPerMlCtrl.text.trim().isEmpty) {
                    _mgPerMlCtrl.text = NumberParseUtils.formatOptionalDouble(
                          result.suggestedMgPerMl) ??
                        '';
                  }
                }),
              ),
              if (widget.source == MedicationFormSource.photo &&
                  _ocrPreviewText != null &&
                  _ocrPreviewText!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.neutralLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Erkannter Text (Vorschau)',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.neutral,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _ocrPreviewText!.length > 220
                            ? '${_ocrPreviewText!.substring(0, 220)}…'
                            : _ocrPreviewText!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'monospace',
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Name des Medikaments *',
                  hintText: 'z. B. Adrenalin 1 mg/ml',
                ),
                textCapitalization: TextCapitalization.words,
                autofocus: widget.initialName == null,
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Pflichtfeld' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _quantityCtrl,
                decoration: const InputDecoration(
                  labelText: 'Anfangsbestand *',
                ),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Pflichtfeld';
                  if (int.tryParse(v) == null) return 'Nur ganze Zahlen';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              MedicationConcentrationFields(
                mlController: _mlCtrl,
                mgPerMlController: _mgPerMlCtrl,
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: _pickDate,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _expiryDate == null
                          ? Colors.transparent
                          : AppColors.danger.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: _expiryDate == null
                            ? AppColors.neutral
                            : AppColors.danger,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _expiryDate == null
                              ? 'Ablaufmonat wählen *'
                              : ExpiryDateUtils.toDisplay(
                                  ExpiryDateUtils.toStorage(_expiryDate!),
                                ),
                          style: TextStyle(
                            fontSize: 15,
                            color: _expiryDate == null
                                ? AppColors.neutral
                                : const Color(0xFF1A1A1A),
                            fontWeight: _expiryDate != null
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded,
                          color: AppColors.neutral),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Medikament speichern'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
