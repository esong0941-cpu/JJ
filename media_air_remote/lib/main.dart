import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/app_mode_provider.dart';
import 'providers/gesture_provider.dart';
import 'providers/library_provider.dart';
import 'providers/orientation_provider.dart';
import 'providers/receiver_provider.dart';
import 'providers/remote_executor.dart';
import 'providers/voice_provider.dart';
import 'screens/mode_select_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/pairing/receiver_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MediaAirRemoteApp());
}

class MediaAirRemoteApp extends StatelessWidget {
  const MediaAirRemoteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppModeProvider()..load()),
        ChangeNotifierProvider(create: (_) => RemoteExecutor()),
        ChangeNotifierProvider(create: (_) => LibraryProvider()..load()),
        ChangeNotifierProvider(create: (_) => OrientationProvider()),
        ChangeNotifierProvider(create: (_) => GestureProvider()),
        ChangeNotifierProvider(create: (_) => VoiceProvider()),
        ChangeNotifierProvider(create: (_) => ReceiverProvider()),
      ],
      child: MaterialApp(
        title: 'Media Air Remote',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: const Color(0xFF3D5AFE),
          brightness: Brightness.dark,
          useMaterial3: true,
        ),
        home: const _RootRouter(),
      ),
    );
  }
}

class _RootRouter extends StatelessWidget {
  const _RootRouter();

  @override
  Widget build(BuildContext context) {
    final appMode = context.watch<AppModeProvider>();
    switch (appMode.mode) {
      case AppMode.unset:
        return const ModeSelectScreen();
      case AppMode.controller:
        return const HomeScreen();
      case AppMode.receiver:
        return const ReceiverHomeScreen();
    }
  }
}
