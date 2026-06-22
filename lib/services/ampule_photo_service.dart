import 'dart:io';

import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../utils/concentration_parser.dart';
import '../utils/ocr_text_parser.dart';

class AmpuleOcrResult {
  const AmpuleOcrResult({
    required this.rawText,
    this.suggestedName,
    this.suggestedExpiry,
    this.suggestedMlPerAmpule,
    this.suggestedMgPerMl,
    this.photoPath,
  });

  final String rawText;
  final String? suggestedName;
  final DateTime? suggestedExpiry;
  final double? suggestedMlPerAmpule;
  final double? suggestedMgPerMl;
  final String? photoPath;

  bool get hasSuggestions =>
      (suggestedName != null && suggestedName!.isNotEmpty) ||
      suggestedExpiry != null ||
      suggestedMlPerAmpule != null ||
      suggestedMgPerMl != null;
}

class AmpulePhotoService {
  final ImagePicker _picker = ImagePicker();
  final TextRecognizer _recognizer =
      TextRecognizer(script: TextRecognitionScript.latin);

  Future<AmpuleOcrResult?> captureAndRecognize() async {
    final picked = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
      preferredCameraDevice: CameraDevice.rear,
    );
    if (picked == null) return null;

    final savedPath = await _persistPhoto(picked.path);
    final inputImage = InputImage.fromFilePath(savedPath);
    final recognizedText = await _recognizer.processImage(inputImage);
    final rawText = recognizedText.text.trim();
    final concentration = ConcentrationParser.parse(rawText);

    return AmpuleOcrResult(
      rawText: rawText,
      suggestedName: OcrTextParser.suggestMedicationName(rawText),
      suggestedExpiry: OcrTextParser.suggestExpiryDate(rawText),
      suggestedMlPerAmpule: concentration.mlPerAmpule,
      suggestedMgPerMl: concentration.mgPerMl,
      photoPath: savedPath,
    );
  }

  Future<String> _persistPhoto(String sourcePath) async {
    final docsDir = await getApplicationDocumentsDirectory();
    final photosDir = Directory(p.join(docsDir.path, 'ampule_photos'));
    if (!await photosDir.exists()) {
      await photosDir.create(recursive: true);
    }

    final fileName = 'ampule_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final destination = p.join(photosDir.path, fileName);
    await File(sourcePath).copy(destination);
    return destination;
  }

  Future<void> deletePhotoFile(String? path) async {
    if (path == null || path.isEmpty) return;
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
    }
  }

  void dispose() {
    _recognizer.close();
  }
}
