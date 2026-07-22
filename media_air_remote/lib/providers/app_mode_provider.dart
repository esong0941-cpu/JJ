import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppMode { unset, controller, receiver }

/// Whether this install of MAR acts as the "리모컨" (controller, runs on the
/// user's phone) or the "수신기" (receiver, runs on the target TV/Android
/// box being controlled). Chosen once on first launch, changeable in Settings.
class AppModeProvider extends ChangeNotifier {
  static const _prefKey = 'app_mode';

  AppMode _mode = AppMode.unset;
  AppMode get mode => _mode;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefKey);
    _mode = AppMode.values.firstWhere(
      (m) => m.name == stored,
      orElse: () => AppMode.unset,
    );
    notifyListeners();
  }

  Future<void> setMode(AppMode mode) async {
    _mode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, mode.name);
    notifyListeners();
  }
}
