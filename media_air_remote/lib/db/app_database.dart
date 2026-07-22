import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/paired_device.dart';

/// Single sqflite database for everything MAR needs to remember locally:
/// favorite channels, recently launched apps, and paired receiver devices.
class AppDatabase {
  AppDatabase._();
  static final AppDatabase instance = AppDatabase._();

  Database? _db;

  Future<Database> get database async {
    _db ??= await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'media_air_remote.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE favorite_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL UNIQUE,
            label TEXT,
            sortOrder INTEGER NOT NULL DEFAULT 0
          )
        ''');
        await db.execute('''
          CREATE TABLE recent_apps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appId TEXT NOT NULL UNIQUE,
            lastUsed TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE paired_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            token TEXT NOT NULL,
            lastConnected TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE gesture_mappings (
            gesture TEXT PRIMARY KEY,
            action TEXT NOT NULL
          )
        ''');
        // Seed default favorite quick channels from the spec.
        for (final n in ['11', '30', '245']) {
          await db.insert('favorite_channels', {'number': n, 'label': null, 'sortOrder': 0});
        }
      },
    );
  }

  // ---- Favorite channels ----

  Future<List<String>> favoriteChannels() async {
    final db = await database;
    final rows = await db.query('favorite_channels', orderBy: 'sortOrder ASC, id ASC');
    return rows.map((r) => r['number'] as String).toList();
  }

  Future<void> addFavoriteChannel(String number) async {
    final db = await database;
    await db.insert(
      'favorite_channels',
      {'number': number, 'sortOrder': 0},
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<void> removeFavoriteChannel(String number) async {
    final db = await database;
    await db.delete('favorite_channels', where: 'number = ?', whereArgs: [number]);
  }

  // ---- Recent apps ----

  Future<List<String>> recentApps({int limit = 5}) async {
    final db = await database;
    final rows = await db.query('recent_apps', orderBy: 'lastUsed DESC', limit: limit);
    return rows.map((r) => r['appId'] as String).toList();
  }

  Future<void> touchRecentApp(String appId) async {
    final db = await database;
    await db.insert(
      'recent_apps',
      {'appId': appId, 'lastUsed': DateTime.now().toIso8601String()},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // ---- Paired devices ----

  Future<List<PairedDevice>> pairedDevices() async {
    final db = await database;
    final rows = await db.query('paired_devices', orderBy: 'lastConnected DESC');
    return rows.map(PairedDevice.fromMap).toList();
  }

  Future<PairedDevice> upsertPairedDevice(PairedDevice device) async {
    final db = await database;
    final existing = await db.query(
      'paired_devices',
      where: 'host = ? AND port = ?',
      whereArgs: [device.host, device.port],
    );
    if (existing.isNotEmpty) {
      final id = existing.first['id'] as int;
      await db.update('paired_devices', device.toMap()..remove('id'), where: 'id = ?', whereArgs: [id]);
      return PairedDevice.fromMap({...device.toMap(), 'id': id});
    }
    final id = await db.insert('paired_devices', device.toMap());
    return PairedDevice.fromMap({...device.toMap(), 'id': id});
  }

  Future<void> removePairedDevice(int id) async {
    final db = await database;
    await db.delete('paired_devices', where: 'id = ?', whereArgs: [id]);
  }

  // ---- Gesture mappings (user-customizable gesture -> action) ----

  Future<Map<String, String>> gestureMappings() async {
    final db = await database;
    final rows = await db.query('gesture_mappings');
    return {for (final r in rows) r['gesture'] as String: r['action'] as String};
  }

  Future<void> setGestureMapping(String gesture, String action) async {
    final db = await database;
    await db.insert(
      'gesture_mappings',
      {'gesture': gesture, 'action': action},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
}
