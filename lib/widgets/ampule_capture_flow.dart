import 'package:flutter/material.dart';

import '../services/ampule_photo_service.dart';
import 'medication_form_sheet.dart';

Future<void> captureAmpuleAndOpenForm(
  BuildContext context,
  AmpulePhotoService photoService, {
  MedicationFormSource source = MedicationFormSource.photo,
}) async {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => const Center(
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Ampulle wird analysiert…'),
            ],
          ),
        ),
      ),
    ),
  );

  try {
    final result = await photoService.captureAndRecognize();
    if (!context.mounted) return;
    Navigator.pop(context);

    if (result == null) return;

    if (!result.hasSuggestions) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Kein Text erkannt. Bitte Daten manuell eingeben.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    await showMedicationFormSheet(
      context,
      initialName: result.suggestedName,
      initialExpiry: result.suggestedExpiry,
      initialMlPerAmpule: result.suggestedMlPerAmpule,
      initialMgPerMl: result.suggestedMgPerMl,
      photoPath: result.photoPath,
      ocrPreviewText: result.rawText,
      source: source,
    );
  } catch (e) {
    if (!context.mounted) return;
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Foto-Erkennung fehlgeschlagen: $e'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
