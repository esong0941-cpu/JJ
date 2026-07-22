import 'package:flutter/foundation.dart';

import '../db/app_database.dart';
import '../models/ott_app.dart';

/// Reactive view over favorites / recent apps / installed-app detection,
/// backed by [AppDatabase] and the native package manager query.
class LibraryProvider extends ChangeNotifier {
  List<String> favoriteChannels = [];
  List<OttApp> recentApps = [];
  Set<String> installedPackageNames = {};

  Future<void> load() async {
    favoriteChannels = await AppDatabase.instance.favoriteChannels();
    final recentIds = await AppDatabase.instance.recentApps();
    recentApps = recentIds.map(OttApp.byId).whereType<OttApp>().toList();
    notifyListeners();
  }

  Future<void> addFavoriteChannel(String number) async {
    await AppDatabase.instance.addFavoriteChannel(number);
    await load();
  }

  Future<void> removeFavoriteChannel(String number) async {
    await AppDatabase.instance.removeFavoriteChannel(number);
    await load();
  }

  Future<void> recordAppLaunch(String appId) async {
    await AppDatabase.instance.touchRecentApp(appId);
    await load();
  }

  void setInstalledPackages(Set<String> packages) {
    installedPackageNames = packages;
    notifyListeners();
  }

  bool isInstalled(OttApp app) => installedPackageNames.contains(app.packageName);
}
