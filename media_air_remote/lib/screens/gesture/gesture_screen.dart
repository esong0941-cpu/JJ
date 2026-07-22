import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/remote_command.dart';
import '../../providers/gesture_provider.dart';
import '../../providers/library_provider.dart';
import '../../providers/remote_executor.dart';

class GestureScreen extends StatefulWidget {
  const GestureScreen({super.key});

  @override
  State<GestureScreen> createState() => _GestureScreenState();
}

class _GestureScreenState extends State<GestureScreen> {
  StreamSubscription<HandGesture>? _sub;
  HandGesture? _lastGesture;
  int _favoriteIndex = 0;

  static const _legend = [
    ('✋', '손바닥', '재생 / 일시정지'),
    ('👉', '오른쪽으로 손 흔들기', '다음 채널'),
    ('👈', '왼쪽으로 손 흔들기', '이전 채널'),
    ('👍', '엄지척', '즐겨찾기 채널'),
    ('✌️', '브이(V)', '음소거'),
    ('✊', '주먹', '종료'),
  ];

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
      case HandGesture.palm:
        executor.send(const RemoteCommand(RemoteAction.mediaPlayPause));
        break;
      case HandGesture.swipeRight:
        executor.send(const RemoteCommand(RemoteAction.channelUp));
        break;
      case HandGesture.swipeLeft:
        executor.send(const RemoteCommand(RemoteAction.channelDown));
        break;
      case HandGesture.thumbUp:
        final favorites = context.read<LibraryProvider>().favoriteChannels;
        if (favorites.isNotEmpty) {
          _favoriteIndex = (_favoriteIndex + 1) % favorites.length;
          executor.send(RemoteCommand(RemoteAction.enterChannelNumber, payload: favorites[_favoriteIndex]));
        }
        break;
      case HandGesture.vSign:
        executor.send(const RemoteCommand(RemoteAction.mute));
        break;
      case HandGesture.fist:
        Navigator.of(context).maybePop();
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final gesture = context.watch<GestureProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('제스처 모드')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text(
              '카메라를 켜면 화면에 손만 보여도 동작합니다. (일반 밝기의 단순한 배경에서 가장 잘 인식됩니다)',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
          if (gesture.active && gesture.controller != null)
            AspectRatio(
              aspectRatio: 3 / 4,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CameraPreview(gesture.controller as CameraController),
                    if (_lastGesture != null)
                      Positioned(
                        bottom: 8,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                            child: Text(_gestureLabel(_lastGesture!), style: const TextStyle(color: Colors.white)),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            )
          else
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView(
              children: [
                for (final (emoji, name, action) in _legend)
                  ListTile(
                    leading: Text(emoji, style: const TextStyle(fontSize: 24)),
                    title: Text(name),
                    trailing: Text(action, style: const TextStyle(color: Colors.white54)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _gestureLabel(HandGesture g) => switch (g) {
        HandGesture.palm => '✋ 손바닥 인식',
        HandGesture.fist => '✊ 주먹 인식',
        HandGesture.thumbUp => '👍 엄지척 인식',
        HandGesture.vSign => '✌️ 브이 인식',
        HandGesture.swipeLeft => '👈 왼쪽 스와이프',
        HandGesture.swipeRight => '👉 오른쪽 스와이프',
      };
}
