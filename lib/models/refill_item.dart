class RefillItem {
  final int? id;
  final int medicationId;
  final int amountNeeded;

  // Joined field – wird beim Lesen aus der DB mit einem JOIN befüllt
  final String? medicationName;

  const RefillItem({
    this.id,
    required this.medicationId,
    required this.amountNeeded,
    this.medicationName,
  });

  RefillItem copyWith({
    int? id,
    int? medicationId,
    int? amountNeeded,
    String? medicationName,
  }) {
    return RefillItem(
      id: id ?? this.id,
      medicationId: medicationId ?? this.medicationId,
      amountNeeded: amountNeeded ?? this.amountNeeded,
      medicationName: medicationName ?? this.medicationName,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'medication_id': medicationId,
      'amount_needed': amountNeeded,
    };
  }

  factory RefillItem.fromMap(Map<String, dynamic> map) {
    return RefillItem(
      id: map['id'] as int?,
      medicationId: map['medication_id'] as int,
      amountNeeded: map['amount_needed'] as int,
      medicationName: map['name'] as String?,
    );
  }
}
