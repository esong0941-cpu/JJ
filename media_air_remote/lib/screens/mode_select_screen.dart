import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_mode_provider.dart';

/// First-launch chooser: is this install the phone doing the controlling,
/// or the TV/Android box being controlled?
class ModeSelectScreen extends StatelessWidget {
  const ModeSelectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('📺', style: TextStyle(fontSize: 64)),
              const SizedBox(height: 12),
              Text(
                'Media Air Remote',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              const Text(
                '이 기기를 어떤 용도로 사용할까요?',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 32),
              _ModeCard(
                emoji: '📱',
                title: '리모컨 모드',
                description: '이 기기(휴대폰)로 다른 기기 또는 이 기기 자체를 제스처·음성·터치로 조작합니다.',
                onTap: () => context.read<AppModeProvider>().setMode(AppMode.controller),
              ),
              const SizedBox(height: 16),
              _ModeCard(
                emoji: '📡',
                title: '수신기 모드',
                description: 'TV박스 등 조작 대상 기기에 설치합니다. 같은 와이파이의 리모컨 기기로부터 명령을 받아 실행합니다.',
                onTap: () => context.read<AppModeProvider>().setMode(AppMode.receiver),
              ),
              const SizedBox(height: 24),
              const Text(
                '설정에서 언제든 변경할 수 있습니다.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _ModeCard({
    required this.emoji,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 40)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(description, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
