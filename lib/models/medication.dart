import 'medication_batch.dart';
import '../utils/expiry_date_utils.dart';

class Medication {
  final int? id;
  final String barcode;
  final String name;
  final String expiryDate; // Zusammenfassung: frühester relevanter MHD
  final int quantity; // Summe aller Chargen
  final String? photoPath;
  final double? mlPerAmpule;
  final double? mgPerMl;
  final List<MedicationBatch> batches;

  const Medication({
    this.id,
    required this.barcode,
    required this.name,
    required this.expiryDate,
    required this.quantity,
    this.photoPath,
    this.mlPerAmpule,
    this.mgPerMl,
    this.batches = const [],
  });

  bool get isManual => barcode.startsWith('manual_');

  int get totalQuantity =>
      batches.isEmpty ? quantity : batches.fold(0, (sum, b) => sum + b.quantity);

  List<MedicationBatch> get sortedBatches {
    final list = List<MedicationBatch>.from(batches);
    list.sort((a, b) => a.expiryDate.compareTo(b.expiryDate));
    return list;
  }

  MedicationBatch? get earliestBatchWithStock {
    for (final batch in sortedBatches) {
      if (batch.quantity > 0) return batch;
    }
    return sortedBatches.isEmpty ? null : sortedBatches.first;
  }

  Medication copyWith({
    int? id,
    String? barcode,
    String? name,
    String? expiryDate,
    int? quantity,
    String? photoPath,
    double? mlPerAmpule,
    double? mgPerMl,
    List<MedicationBatch>? batches,
    bool clearMlPerAmpule = false,
    bool clearMgPerMl = false,
    bool clearPhotoPath = false,
  }) {
    return Medication(
      id: id ?? this.id,
      barcode: barcode ?? this.barcode,
      name: name ?? this.name,
      expiryDate: expiryDate ?? this.expiryDate,
      quantity: quantity ?? this.quantity,
      photoPath: clearPhotoPath ? null : (photoPath ?? this.photoPath),
      mlPerAmpule:
          clearMlPerAmpule ? null : (mlPerAmpule ?? this.mlPerAmpule),
      mgPerMl: clearMgPerMl ? null : (mgPerMl ?? this.mgPerMl),
      batches: batches ?? this.batches,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'barcode': barcode,
      'name': name,
      'expiry_date': expiryDate,
      'quantity': quantity,
      'photo_path': photoPath,
      'ml_per_ampule': mlPerAmpule,
      'mg_per_ml': mgPerMl,
    };
  }

  factory Medication.fromMap(
    Map<String, dynamic> map, {
    List<MedicationBatch> batches = const [],
  }) {
    return Medication(
      id: map['id'] as int?,
      barcode: map['barcode'] as String,
      name: map['name'] as String,
      expiryDate: _normalizeExpiryDate(map['expiry_date'] as String),
      quantity: map['quantity'] as int,
      photoPath: map['photo_path'] as String?,
      mlPerAmpule: (map['ml_per_ampule'] as num?)?.toDouble(),
      mgPerMl: (map['mg_per_ml'] as num?)?.toDouble(),
      batches: batches,
    );
  }

  static String _normalizeExpiryDate(String value) {
    final parts = value.split('-');
    if (parts.length >= 2) {
      return '${parts[0]}-${parts[1]}';
    }
    return value;
  }

  bool get isExpiringSoon {
    if (batches.isNotEmpty) {
      return batches.any((b) => b.quantity > 0 && b.isExpiringSoon);
    }
    return ExpiryDateUtils.isExpiringSoon(expiryDate);
  }

  bool get isExpired {
    if (batches.isNotEmpty) {
      return totalQuantity == 0 ||
          batches.every((b) => b.quantity == 0 || b.isExpired);
    }
    return ExpiryDateUtils.isExpired(expiryDate);
  }
}
