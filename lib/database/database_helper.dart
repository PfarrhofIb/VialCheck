import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

import '../models/medication.dart';
import '../models/medication_batch.dart';
import '../models/refill_item.dart';

class DatabaseHelper {
  static const _databaseName = 'emergency_meds.db';
  static const _databaseVersion = 4;

  static const tableMedications = 'medications';
  static const tableMedicationBatches = 'medication_batches';
  static const tableRefillList = 'refill_list';

  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  Database? _database;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _databaseName);
    return openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
        'ALTER TABLE $tableMedications ADD COLUMN photo_path TEXT',
      );
    }
    if (oldVersion < 3) {
      await db.execute(
        'ALTER TABLE $tableMedications ADD COLUMN ml_per_ampule REAL',
      );
      await db.execute(
        'ALTER TABLE $tableMedications ADD COLUMN mg_per_ml REAL',
      );
    }
    if (oldVersion < 4) {
      await db.execute('''
        CREATE TABLE $tableMedicationBatches (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          medication_id  INTEGER NOT NULL,
          expiry_date    TEXT    NOT NULL,
          quantity       INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (medication_id) REFERENCES $tableMedications(id)
            ON DELETE CASCADE,
          UNIQUE (medication_id, expiry_date)
        )
      ''');
      final meds = await db.query(tableMedications);
      for (final med in meds) {
        await db.insert(tableMedicationBatches, {
          'medication_id': med['id'],
          'expiry_date': med['expiry_date'],
          'quantity': med['quantity'],
        });
      }
    }
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $tableMedications (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode    TEXT    NOT NULL UNIQUE,
        name       TEXT    NOT NULL,
        expiry_date TEXT   NOT NULL,
        quantity   INTEGER NOT NULL DEFAULT 0,
        photo_path TEXT,
        ml_per_ampule REAL,
        mg_per_ml REAL
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableMedicationBatches (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id  INTEGER NOT NULL,
        expiry_date    TEXT    NOT NULL,
        quantity       INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (medication_id) REFERENCES $tableMedications(id)
          ON DELETE CASCADE,
        UNIQUE (medication_id, expiry_date)
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableRefillList (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id  INTEGER NOT NULL,
        amount_needed  INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (medication_id) REFERENCES $tableMedications(id)
          ON DELETE CASCADE
      )
    ''');
  }

  // ──────────────────────────────────────────────
  // MEDICATIONS
  // ──────────────────────────────────────────────

  Future<List<Medication>> getAllMedications() async {
    final db = await database;
    final medMaps = await db.query(
      tableMedications,
      orderBy: 'expiry_date ASC',
    );
    final batchMaps = await db.query(
      tableMedicationBatches,
      orderBy: 'expiry_date ASC',
    );

    final batchesByMed = <int, List<MedicationBatch>>{};
    for (final map in batchMaps) {
      final batch = MedicationBatch.fromMap(map);
      batchesByMed.putIfAbsent(batch.medicationId, () => []).add(batch);
    }

    return medMaps
        .map(
          (map) => Medication.fromMap(
            map,
            batches: batchesByMed[map['id'] as int] ?? const [],
          ),
        )
        .toList();
  }

  Future<Medication?> getMedicationByBarcode(String barcode) async {
    final db = await database;
    final maps = await db.query(
      tableMedications,
      where: 'barcode = ?',
      whereArgs: [barcode],
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return _medicationWithBatches(maps.first);
  }

  Future<Medication?> getMedicationByName(String name) async {
    final db = await database;
    final maps = await db.query(
      tableMedications,
      where: 'LOWER(name) = ?',
      whereArgs: [name.trim().toLowerCase()],
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return _medicationWithBatches(maps.first);
  }

  Future<Medication?> getMedicationById(int id) async {
    final db = await database;
    final maps = await db.query(
      tableMedications,
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return _medicationWithBatches(maps.first);
  }

  Future<Medication> _medicationWithBatches(Map<String, dynamic> map) async {
    final batches = await getBatchesForMedication(map['id'] as int);
    return Medication.fromMap(map, batches: batches);
  }

  Future<int> insertMedication(Medication medication) async {
    final db = await database;
    return db.insert(
      tableMedications,
      medication.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> updateMedication(Medication medication) async {
    final db = await database;
    return db.update(
      tableMedications,
      medication.toMap(),
      where: 'id = ?',
      whereArgs: [medication.id],
    );
  }

  Future<int> deleteMedication(int id) async {
    final db = await database;
    return db.delete(
      tableMedications,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ──────────────────────────────────────────────
  // BATCHES
  // ──────────────────────────────────────────────

  Future<List<MedicationBatch>> getBatchesForMedication(int medicationId) async {
    final db = await database;
    final maps = await db.query(
      tableMedicationBatches,
      where: 'medication_id = ?',
      whereArgs: [medicationId],
      orderBy: 'expiry_date ASC',
    );
    return maps.map(MedicationBatch.fromMap).toList();
  }

  Future<void> addOrIncrementBatch(
    int medicationId,
    String expiryDate, {
    int increment = 1,
  }) async {
    final db = await database;
    final normalized = MedicationBatch.fromMap({
      'medication_id': medicationId,
      'expiry_date': expiryDate,
      'quantity': 0,
    }).expiryDate;

    final existing = await db.query(
      tableMedicationBatches,
      where: 'medication_id = ? AND expiry_date = ?',
      whereArgs: [medicationId, normalized],
      limit: 1,
    );

    if (existing.isEmpty) {
      await db.insert(tableMedicationBatches, {
        'medication_id': medicationId,
        'expiry_date': normalized,
        'quantity': increment,
      });
    } else {
      final current = existing.first['quantity'] as int;
      await db.update(
        tableMedicationBatches,
        {'quantity': current + increment},
        where: 'id = ?',
        whereArgs: [existing.first['id']],
      );
    }

    await _syncMedicationSummary(medicationId);
  }

  Future<bool> consumeOneFromBatch(
    int medicationId,
    String expiryDate,
  ) async {
    final db = await database;
    final normalized = MedicationBatch.fromMap({
      'medication_id': medicationId,
      'expiry_date': expiryDate,
      'quantity': 0,
    }).expiryDate;

    final existing = await db.query(
      tableMedicationBatches,
      where: 'medication_id = ? AND expiry_date = ?',
      whereArgs: [medicationId, normalized],
      limit: 1,
    );
    if (existing.isEmpty) return false;

    final current = existing.first['quantity'] as int;
    if (current <= 0) return false;

    await db.update(
      tableMedicationBatches,
      {'quantity': current - 1},
      where: 'id = ?',
      whereArgs: [existing.first['id']],
    );
    await _syncMedicationSummary(medicationId);
    return true;
  }

  Future<void> _syncMedicationSummary(int medicationId) async {
    final db = await database;
    final batches = await getBatchesForMedication(medicationId);
    final total = batches.fold<int>(0, (sum, b) => sum + b.quantity);
    final summaryExpiry = batches.isEmpty
        ? '2099-12'
        : (batches.firstWhere(
              (b) => b.quantity > 0,
              orElse: () => batches.first,
            ).expiryDate);

    await db.update(
      tableMedications,
      {
        'quantity': total,
        'expiry_date': summaryExpiry,
      },
      where: 'id = ?',
      whereArgs: [medicationId],
    );
  }

  // ──────────────────────────────────────────────
  // REFILL LIST
  // ──────────────────────────────────────────────

  Future<List<RefillItem>> getRefillList() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT r.id, r.medication_id, r.amount_needed, m.name
      FROM $tableRefillList r
      INNER JOIN $tableMedications m ON r.medication_id = m.id
      ORDER BY r.id ASC
    ''');
    return maps.map(RefillItem.fromMap).toList();
  }

  Future<void> addOrIncrementRefill(int medicationId, {int increment = 1}) async {
    final db = await database;

    final existing = await db.query(
      tableRefillList,
      where: 'medication_id = ?',
      whereArgs: [medicationId],
      limit: 1,
    );

    if (existing.isEmpty) {
      await db.insert(tableRefillList, {
        'medication_id': medicationId,
        'amount_needed': increment,
      });
    } else {
      final currentAmount = existing.first['amount_needed'] as int;
      await db.update(
        tableRefillList,
        {'amount_needed': currentAmount + increment},
        where: 'medication_id = ?',
        whereArgs: [medicationId],
      );
    }
  }

  Future<int> deleteRefillItem(int id) async {
    final db = await database;
    return db.delete(
      tableRefillList,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> deleteRefillItemByMedicationId(int medicationId) async {
    final db = await database;
    await db.delete(
      tableRefillList,
      where: 'medication_id = ?',
      whereArgs: [medicationId],
    );
  }
}
