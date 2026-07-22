import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/ott_app.dart';
import '../../models/remote_command.dart';
import '../../native/native_remote_bridge.dart';
import '../../providers/library_provider.dart';
import '../../providers/orientation_provider.dart';
import '../../providers/remote_executor.dart';
import '../../widgets/device_link_banner.dart';
import '../dishwashing/dishwashing_screen.dart';
import '../gesture/gesture_screen.dart';
import '../remote/remote_screen.dart';
import '../settings/settings_screen.dart';
import '../voice/voice_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkInstalledApps());
  }

  Future<void> _checkInstalledApps() async {
    final packages = OttApp.catalog.map((a) => a.packageName).toList();
    final installed = await NativeRemoteBridge.instance.installedPackages(packages);
    if (mounted) {
      context.read<LibraryProvider>().setInstalledPackages(installed.toSet());
    }
  }

  @override
  Widget build(BuildContext context) {
    final orientationProvider = context.watch<OrientationProvider>();

    // Smart mode: physically tilting the phone landscape jumps straight to
    // the remote screen; portrait shows this app picker.
    if (orientationProvider.smartModeEnabled && orientationProvider.orientation == PhysicalOrientation.landscape) {
      return const RemoteScreen();
    }

    final library = context.watch<LibraryProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Media Remote'),
        actions: [
          const Padding(padding: EdgeInsets.only(right: 8), child: Center(child: DeviceLinkBanner())),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ottGrid(context, library),
          const SizedBox(height: 24),
          if (library.recentApps.isNotEmpty) ...[
            const _SectionTitle('최근 실행'),
            _recentRow(context, library),
            const SizedBox(height: 24),
          ],
          const _SectionTitle('즐겨찾기 채널'),
          _favoriteChannels(context, library),
          const SizedBox(height: 24),
          const _SectionTitle('모드'),
          _modeGrid(context),
        ],
      ),
    );
  }

  Widget _ottGrid(BuildContext context, LibraryProvider library) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.95,
      children: [
        for (final app in OttApp.catalog)
          _OttTile(
            app: app,
            installed: library.isInstalled(app),
            onTap: () async {
              final executor = context.read<RemoteExecutor>();
              final lib = context.read<LibraryProvider>();
              await executor.launchApp(app.packageName);
              await lib.recordAppLaunch(app.id);
            },
          ),
      ],
    );
  }

  Widget _recentRow(BuildContext context, LibraryProvider library) {
    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: library.recentApps.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final app = library.recentApps[i];
          return ActionChip(
            avatar: Text(app.emoji),
            label: Text(app.label),
            onPressed: () async {
              final executor = context.read<RemoteExecutor>();
              final lib = context.read<LibraryProvider>();
              await executor.launchApp(app.packageName);
              await lib.recordAppLaunch(app.id);
            },
          );
        },
      ),
    );
  }

  Widget _favoriteChannels(BuildContext context, LibraryProvider library) {
    if (library.favoriteChannels.isEmpty) {
      return const Text('설정에서 즐겨찾기 채널을 추가하세요.', style: TextStyle(color: Colors.white54));
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final ch in library.favoriteChannels)
          ActionChip(
            label: Text('$ch번'),
            onPressed: () => context.read<RemoteExecutor>().send(
              RemoteCommand(RemoteAction.enterChannelNumber, payload: ch),
            ),
          ),
      ],
    );
  }

  Widget _modeGrid(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.4,
      children: [
        _ModeButton(
          emoji: '🎛️',
          label: '리모컨',
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RemoteScreen())),
        ),
        _ModeButton(
          emoji: '🧼',
          label: '설거지 모드',
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DishwashingScreen())),
        ),
        _ModeButton(
          emoji: '✋',
          label: '제스처 모드',
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GestureScreen())),
        ),
        _ModeButton(
          emoji: '🎙️',
          label: '음성 모드',
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceScreen())),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Colors.white70)),
    );
  }
}

class _OttTile extends StatelessWidget {
  final OttApp app;
  final bool installed;
  final VoidCallback onTap;

  const _OttTile({required this.app, required this.installed, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(app.emoji, style: const TextStyle(fontSize: 30)),
              const SizedBox(height: 6),
              Text(app.label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
              if (!installed)
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Text('미설치', style: TextStyle(fontSize: 10, color: Colors.white38)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback onTap;

  const _ModeButton({required this.emoji, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
