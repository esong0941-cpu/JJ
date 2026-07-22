import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/remote_command.dart';
import '../../providers/gesture_provider.dart';
import '../../providers/library_provider.dart';
import '../../providers/remote_executor.dart';

/// "설거지 모드": hands are wet, so no touch — only large, easy-to-see
/// camera gestures from a distance. Reuses [GestureProvider] but the UI
/// only surfaces the four big, high-tolerance gestures from the spec.
class DishwashingScreen extends StatefulWidget {
  const DishwashingScreen({super.key});

  @override
  State<DishwashingScreen> createState() => _DishwashingScreenState();
}

class _DishwashingScreenState extends State<DishwashingScreen> {
  StreamSubscription<HandGesture>? _sub;
  HandGesture? _lastGesture;
  int _favoriteIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final gesture = context.read<GestureProvider>();
      await gesture.start();
      _sub = gesture.gestureStream.listen(_onGesture);
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    context.read<GestureProvider>().stop();
    super.dispose();
  }

  void _onGesture(HandGesture gesture) {
    setState(() => _lastGesture = gesture);
    final executor = context.read<RemoteExecutor>();
    switch (gesture) {
      case HandGesture.swipeRight:
        executor.send(const RemoteCommand(RemoteAction.channelUp));
        break;
      case HandGesture.swipeLeft:
        executor.send(const RemoteCommand(RemoteAction.channelDown));
        break;
      case HandGesture.palm:
        executor.send(const RemoteCommand(RemoteAction.mediaPlayPause));
        break;
      case HandGesture.thumbUp:
        final favorites = context.read<LibraryProvider>().favoriteChannels;
        if (favorites.isNotEmpty) {
          _favoriteIndex = (_favoriteIndex + 1) % favorites.length;
          executor.send(RemoteCommand(RemoteAction.enterChannelNumber, payload: favorites[_favoriteIndex]));
        }
        break;
      case HandGesture.fist:
        Navigator.of(context).maybePop();
        break;
      case HandGesture.vSign:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final gesture = context.watch<GestureProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('설거지 모드')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              '젖은 손으로도 멀리서 제어할 수 있도록 큰 동작만 사용합니다.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
          ),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              padding: const EdgeInsets.all(16),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _GestureCard(emoji: '👋', title: '크게 흔들기', subtitle: '← 채널- / 채널+ →', active: _lastGesture == HandGesture.swipeLeft || _lastGesture == HandGesture.swipeRight),
                _GestureCard(emoji: '✋', title: '손바닥', subtitle: '재생 / 정지', active: _lastGesture == HandGesture.palm),
                _GestureCard(emoji: '👍', title: '엄지척', subtitle: '즐겨찾기 채널', active: _lastGesture == HandGesture.thumbUp),
                _GestureCard(emoji: '✊', title: '주먹', subtitle: '설거지 모드 종료', active: _lastGesture == HandGesture.fist),
              ],
            ),
          ),
          if (gesture.active && gesture.controller != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: SizedBox(
                width: 90,
                height: 120,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CameraPreview(gesture.controller as CameraController),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _GestureCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final bool active;

  const _GestureCard({required this.emoji, required this.title, required this.subtitle, required this.active});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: active ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: active ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2) : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 48)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }
}
