import '../utils/expiry_date_utils.dart';

class MedicationBatch {
  final int? id;
  final int medicationId;
  final String expiryDate;
  final int quantity;

  const MedicationBatch({
    this.id,
    required this.medicationId,
    required this.expiryDate,
    required this.quantity,
  });

  MedicationBatch copyWith({
    int? id,
    int? medicationId,
    String? expiryDate,
    int? quantity,
  }) {
    return MedicationBatch(
      id: id ?? this.id,
      medicationId: medicationId ?? this.medicationId,
      expiryDate: expiryDate ?? this.expiryDate,
      quantity: quantity ?? this.quantity,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'medication_id': medicationId,
      'expiry_date': expiryDate,
      'quantity': quantity,
    };
  }

  factory MedicationBatch.fromMap(Map<String, dynamic> map) {
    return MedicationBatch(
      id: map['id'] as int?,
      medicationId: map['medication_id'] as int,
      expiryDate: MedicationBatch._normalizeExpiryDate(map['expiry_date'] as String),
      quantity: map['quantity'] as int,
    );
  }

  static String _normalizeExpiryDate(String value) {
    final parts = value.split('-');
    if (parts.length >= 2) {
      return '${parts[0]}-${parts[1]}';
    }
    return value;
  }

  String get displayExpiry => ExpiryDateUtils.toDisplay(expiryDate);

  bool get isExpiringSoon => ExpiryDateUtils.isExpiringSoon(expiryDate);

  bool get isExpired => ExpiryDateUtils.isExpired(expiryDate);
}
