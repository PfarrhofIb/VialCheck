import 'dart:io';

import 'package:flutter/material.dart';

import '../services/ampule_photo_service.dart';
import '../theme/app_theme.dart';

class MedicationPhotoSection extends StatefulWidget {
  const MedicationPhotoSection({
    super.key,
    required this.photoPath,
    required this.onChanged,
    this.onOcrResult,
    this.photoService,
  });

  final String? photoPath;
  final void Function(String? photoPath) onChanged;
  final void Function(AmpuleOcrResult result)? onOcrResult;
  final AmpulePhotoService? photoService;

  @override
  State<MedicationPhotoSection> createState() => _MedicationPhotoSectionState();
}

class _MedicationPhotoSectionState extends State<MedicationPhotoSection> {
  AmpulePhotoService? _ownedService;
  bool _busy = false;

  AmpulePhotoService get _service => widget.photoService ?? _ownedService!;

  @override
  void initState() {
    super.initState();
    if (widget.photoService == null) {
      _ownedService = AmpulePhotoService();
    }
  }

  @override
  void dispose() {
    _ownedService?.dispose();
    super.dispose();
  }

  Future<void> _captureNew() async {
    if (_busy) return;
    setState(() => _busy = true);

    try {
      final result = await _service.captureAndRecognize();
      if (!mounted || result == null) return;

      if (widget.photoPath != null && widget.photoPath != result.photoPath) {
        await _service.deletePhotoFile(widget.photoPath);
      }

      widget.onChanged(result.photoPath);
      widget.onOcrResult?.call(result);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deletePhoto() async {
    if (_busy || widget.photoPath == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bild löschen?'),
        content: const Text('Das Ampullen-Foto wird dauerhaft entfernt.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Abbrechen'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Löschen'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    await _service.deletePhotoFile(widget.photoPath);
    widget.onChanged(null);
  }

  @override
  Widget build(BuildContext context) {
    final hasPhoto =
        widget.photoPath != null && File(widget.photoPath!).existsSync();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasPhoto) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(widget.photoPath!),
              height: 140,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 10),
        ],
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _captureNew,
                icon: _busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(hasPhoto ? Icons.camera_alt_outlined : Icons.add_a_photo_outlined),
                label: Text(hasPhoto ? 'Neues Foto' : 'Foto aufnehmen'),
              ),
            ),
            if (hasPhoto) ...[
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _busy ? null : _deletePhoto,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.danger,
                  side: const BorderSide(color: AppColors.danger),
                ),
                child: const Icon(Icons.delete_outline, size: 20),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
