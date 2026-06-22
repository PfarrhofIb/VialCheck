import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../models/medication.dart';
import '../providers/medication_provider.dart';
import '../services/ampule_photo_service.dart';
import '../theme/app_theme.dart';
import '../utils/concentration_parser.dart';
import '../widgets/add_batch_sheet.dart';
import '../widgets/ampule_capture_flow.dart';
import '../widgets/medication_form_sheet.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen>
    with WidgetsBindingObserver {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  final _photoService = AmpulePhotoService();

  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_controller.value.isInitialized) return;
    switch (state) {
      case AppLifecycleState.resumed:
        _controller.start();
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        _controller.stop();
      default:
        break;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    _photoService.dispose();
    super.dispose();
  }

  Future<void> _captureAmpulePhoto() async {
    await _controller.stop();
    if (!mounted) return;

    await captureAmpuleAndOpenForm(
      context,
      _photoService,
      source: MedicationFormSource.photo,
    );

    if (mounted) {
      await _controller.start();
    }
  }

  Future<void> _handleDetection(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    setState(() => _isProcessing = true);
    await _controller.stop();

    final rawValue = barcode.rawValue!;

    if (!mounted) return;
    final provider = context.read<MedicationProvider>();
    final existing = await provider.findByBarcode(rawValue);

    if (!mounted) return;

    if (existing != null) {
      await provider.loadMedications();
      if (!mounted) return;
      final fresh = provider.medications.firstWhere(
        (m) => m.id == existing.id,
        orElse: () => existing,
      );
      await _showExistingMedicationSheet(fresh);
    } else {
      await _showNewMedicationForm(rawValue);
    }

    if (mounted) {
      setState(() => _isProcessing = false);
      await _controller.start();
    }
  }

  Future<void> _showExistingMedicationSheet(Medication med) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _ExistingMedicationSheet(medication: med),
    );
  }

  Future<void> _showNewMedicationForm(String barcode) async {
    await showMedicationFormSheet(
      context,
      barcode: barcode,
      source: MedicationFormSource.barcode,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.photo_camera_outlined),
            tooltip: 'Ampulle fotografieren',
            onPressed: _isProcessing ? null : _captureAmpulePhoto,
          ),
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, _) {
              return IconButton(
                icon: Icon(
                  state.torchState == TorchState.on
                      ? Icons.flash_on_rounded
                      : Icons.flash_off_rounded,
                ),
                tooltip: 'Taschenlampe',
                onPressed: _controller.toggleTorch,
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _handleDetection,
          ),
          _ScanOverlay(),
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}

class _ScanOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Column(
        children: [
          Expanded(
            flex: 2,
            child: Container(color: Colors.black45),
          ),
          Row(
            children: [
              Expanded(
                flex: 1,
                child: Container(color: Colors.black45),
              ),
              Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: AppColors.danger,
                    width: 3,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              Expanded(
                flex: 1,
                child: Container(color: Colors.black45),
              ),
            ],
          ),
          Expanded(
            flex: 3,
            child: Container(
              color: Colors.black45,
              child: const Column(
                children: [
                  SizedBox(height: 20),
                  Text(
                    'Barcode scannen oder\nAmpulle über Kamera-Icon fotografieren',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ExistingMedicationSheet extends StatelessWidget {
  const _ExistingMedicationSheet({required this.medication});
  final Medication medication;

  Future<void> _openAddBatch(
    BuildContext context, {
    int initialQuantity = 1,
  }) async {
    Navigator.pop(context);
    await showAddBatchSheet(
      context,
      medication,
      initialQuantity: initialQuantity,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final batches = medication.sortedBatches.where((b) => b.quantity > 0);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        20,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
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
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: AppColors.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Medikament gefunden',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      medication.name,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _InfoRow(
            icon: Icons.inventory_2_outlined,
            label: 'Gesamtbestand',
            value: '${medication.totalQuantity} Stk.',
          ),
          const SizedBox(height: 12),
          Text(
            'Chargen',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          if (batches.isEmpty)
            const Text(
              'Kein Bestand – bitte Charge mit MHD hinzufügen.',
              style: TextStyle(color: AppColors.neutral, fontSize: 14),
            )
          else
            ...batches.map(
              (batch) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  '${batch.quantity}× ${batch.displayExpiry}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          if (ConcentrationParser.formatLabel(
                medication.mlPerAmpule, medication.mgPerMl) !=
              null) ...[
            const SizedBox(height: 12),
            _InfoRow(
              icon: Icons.science_outlined,
              label: 'Konzentration',
              value: ConcentrationParser.formatLabel(
                medication.mlPerAmpule,
                medication.mgPerMl,
              )!,
            ),
          ],
          const SizedBox(height: 24),
          Text(
            'Charge hinzufügen:',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [1, 5, 10, 20].map((amount) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: OutlinedButton(
                    onPressed: () => _openAddBatch(
                      context,
                      initialQuantity: amount,
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      side: const BorderSide(color: AppColors.danger),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text('+$amount'),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _openAddBatch(context),
              icon: const Icon(Icons.calendar_today_outlined, size: 18),
              label: const Text('Charge mit Ablaufmonat…'),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Schließen'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.neutral),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.neutral,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? const Color(0xFF1A1A1A),
          ),
        ),
      ],
    );
  }
}
