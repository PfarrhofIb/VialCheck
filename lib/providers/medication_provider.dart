import 'package:flutter/foundation.dart';

import '../database/database_helper.dart';
import '../models/medication.dart';
import '../models/refill_item.dart';

class MedicationProvider extends ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper.instance;

  List<Medication> _medications = [];
  List<RefillItem> _refillList = [];
  bool _isLoading = false;
  String? _error;

  List<Medication> get medications => List.unmodifiable(_medications);
  List<RefillItem> get refillList => List.unmodifiable(_refillList);
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAll() async {
    _setLoading(true);
    try {
      _medications = await _db.getAllMedications();
      _refillList = await _db.getRefillList();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMedications() async {
    try {
      _medications = await _db.getAllMedications();
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadRefillList() async {
    try {
      _refillList = await _db.getRefillList();
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<Medication?> findByBarcode(String barcode) async {
    return _db.getMedicationByBarcode(barcode);
  }

  /// Speichert Medikament + Charge. Gleicher Name/Barcode → neue Charge.
  Future<void> saveMedicationEntry({
    required String barcode,
    required String name,
    required String expiryDate,
    required int quantity,
    String? photoPath,
    double? mlPerAmpule,
    double? mgPerMl,
    bool removePhoto = false,
  }) async {
    Medication? existing = await _db.getMedicationByBarcode(barcode);
    existing ??= await _db.getMedicationByName(name);

    if (existing?.id != null) {
      await _db.addOrIncrementBatch(existing!.id!, expiryDate, increment: quantity);
      await _db.updateMedication(
        existing.copyWith(
          name: name,
          photoPath: removePhoto ? null : (photoPath ?? existing.photoPath),
          clearPhotoPath: removePhoto,
          mlPerAmpule: mlPerAmpule ?? existing.mlPerAmpule,
          mgPerMl: mgPerMl ?? existing.mgPerMl,
        ),
      );
    } else {
      final medication = Medication(
        barcode: barcode,
        name: name,
        expiryDate: expiryDate,
        quantity: quantity,
        photoPath: photoPath,
        mlPerAmpule: mlPerAmpule,
        mgPerMl: mgPerMl,
      );
      final id = await _db.insertMedication(medication);
      await _db.addOrIncrementBatch(id, expiryDate, increment: quantity);
    }
    await loadMedications();
  }

  Future<void> addBatch(
    Medication medication,
    String expiryDate,
    int quantity,
  ) async {
    if (medication.id == null) return;
    await _db.addOrIncrementBatch(
      medication.id!,
      expiryDate,
      increment: quantity,
    );
    await loadMedications();
  }

  Future<bool> consumeOne(
    Medication medication,
    String expiryDate,
  ) async {
    if (medication.id == null) return false;
    final consumed = await _db.consumeOneFromBatch(
      medication.id!,
      expiryDate,
    );
    if (!consumed) return false;
    await _db.addOrIncrementRefill(medication.id!);
    await loadAll();
    return true;
  }

  Future<void> increaseQuantity(
    Medication medication,
    int amount, {
    required String expiryDate,
  }) async {
    if (medication.id == null) return;
    await _db.addOrIncrementBatch(
      medication.id!,
      expiryDate,
      increment: amount,
    );
    await loadMedications();
  }

  Future<int> addMedication(Medication medication) async {
    final id = await _db.insertMedication(medication);
    await _db.addOrIncrementBatch(
      id,
      medication.expiryDate,
      increment: medication.quantity,
    );
    await loadMedications();
    return id;
  }

  Future<void> updateMedication(Medication medication) async {
    await _db.updateMedication(medication);
    await loadMedications();
  }

  Future<void> deleteMedication(int id) async {
    await _db.deleteMedication(id);
    await loadAll();
  }

  Future<void> markAsRefilled(
    RefillItem item, {
    int? restockAmount,
    String? expiryDate,
  }) async {
    if (item.id == null) return;

    await _db.deleteRefillItem(item.id!);

    if (restockAmount != null && restockAmount > 0) {
      if (expiryDate == null) return;
      await _db.addOrIncrementBatch(
        item.medicationId,
        expiryDate,
        increment: restockAmount,
      );
    }

    await loadAll();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
