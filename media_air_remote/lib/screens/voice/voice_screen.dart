import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/remote_command.dart';
import '../../providers/library_provider.dart';
import '../../providers/remote_executor.dart';
import '../../providers/voice_provider.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  Timer? _countdown;
  Duration? _remaining;

  static const _examples = [
    '"11번" → 채널 변경',
    '"넷플릭스" → 실행',
    '"다음" → 다음 채널',
    '"멈춰" → 일시정지',
    '"소리줄여" → 볼륨 감소',
    '"30분 뒤 종료" → 타이머',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<VoiceProvider>().init());
  }

  @override
  void dispose() {
    _countdown?.cancel();
    context.read<VoiceProvider>().stopListening();
    super.dispose();
  }

  Future<void> _toggleListening(VoiceProvider voice) async {
    if (voice.listening) {
      await voice.stopListening();
      _handleIntent(voice.lastIntent);
    } else {
      await voice.startListening();
    }
  }

  void _handleIntent(VoiceIntent? intent) {
    if (intent == null) return;
    final executor = context.read<RemoteExecutor>();
    if (intent.appToLaunch != null) {
      executor.launchApp(intent.appToLaunch!.packageName);
      context.read<LibraryProvider>().recordAppLaunch(intent.appToLaunch!.id);
    } else if (intent.command != null) {
      executor.send(intent.command!);
    }

    final voice = context.read<VoiceProvider>();
    if (voice.pendingTimer != null) {
      _startCountdown(voice.pendingTimer!);
      voice.pendingTimer = null;
    }
  }

  void _startCountdown(Duration duration) {
    _countdown?.cancel();
    setState(() => _remaining = duration);
    _countdown = Timer.periodic(const Duration(seconds: 1), (timer) {
      final left = (_remaining ?? Duration.zero) - const Duration(seconds: 1);
      if (left <= Duration.zero) {
        timer.cancel();
        setState(() => _remaining = null);
        context.read<RemoteExecutor>().send(const RemoteCommand(RemoteAction.mediaPlayPause));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('타이머가 종료되어 재생을 정지했습니다.')),
          );
        }
      } else {
        setState(() => _remaining = left);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final voice = context.watch<VoiceProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('음성 모드')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            if (_remaining != null)
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined),
                      const SizedBox(width: 8),
                      Text('${_remaining!.inMinutes}분 ${_remaining!.inSeconds % 60}초 뒤 정지'),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          _countdown?.cancel();
                          setState(() => _remaining = null);
                        },
                        child: const Text('취소'),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: voice.available ? () => _toggleListening(voice) : null,
              child: CircleAvatar(
                radius: 64,
                backgroundColor: voice.listening
                    ? Colors.redAccent
                    : Theme.of(context).colorScheme.primary,
                child: Icon(voice.listening ? Icons.mic : Icons.mic_none, size: 56),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              voice.available
                  ? (voice.listening ? '듣고 있어요...' : '탭해서 말하기')
                  : '음성 인식을 사용할 수 없습니다 (마이크 권한을 확인하세요)',
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 12),
            if (voice.lastHeard.isNotEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('"${voice.lastHeard}"', style: const TextStyle(fontSize: 16)),
                ),
              ),
            const SizedBox(height: 24),
            const Align(alignment: Alignment.centerLeft, child: Text('예시', style: TextStyle(color: Colors.white54))),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                children: [for (final e in _examples) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text(e))],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
