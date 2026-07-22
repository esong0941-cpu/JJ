import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../native/native_remote_bridge.dart';
import '../../network/receiver_server.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/receiver_provider.dart';

/// Shown when this install of MAR is running in "수신기 모드": the screen
/// meant to live on the target Android device (TV box etc). Displays a QR
/// code + PIN a controller phone can pair with, and the live connection
/// status/accessibility-permission state.
class ReceiverHomeScreen extends StatefulWidget {
  const ReceiverHomeScreen({super.key});

  @override
  State<ReceiverHomeScreen> createState() => _ReceiverHomeScreenState();
}

class _ReceiverHomeScreenState extends State<ReceiverHomeScreen> {
  bool _accessibilityEnabled = false;

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<ReceiverProvider>().start();
      _refreshAccessibility();
    });
  }

  Future<void> _refreshAccessibility() async {
    final enabled = await NativeRemoteBridge.instance.isAccessibilityServiceEnabled();
    if (mounted) setState(() => _accessibilityEnabled = enabled);
  }

  @override
  void dispose() {
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final receiver = context.watch<ReceiverProvider>();
    final qrPayload = jsonEncode({
      'host': receiver.localIp ?? '',
      'port': kReceiverPort,
      'pin': receiver.pin,
      'name': receiver.deviceName,
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('수신기 모드'),
        actions: [
          IconButton(
            icon: const Icon(Icons.smartphone),
            tooltip: '리모컨 모드로 전환',
            onPressed: () => context.read<AppModeProvider>().setMode(AppMode.controller),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(receiver.deviceName, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          _StatusChip(state: receiver.state, connectedFrom: receiver.connectedFrom),
          const SizedBox(height: 24),
          if (receiver.localIp == null)
            const Center(child: Text('와이파이에 연결되어 있는지 확인하세요.', style: TextStyle(color: Colors.orangeAccent)))
          else
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: QrImageView(data: qrPayload, size: 220),
              ),
            ),
          const SizedBox(height: 16),
          Center(
            child: Column(
              children: [
                const Text('PIN', style: TextStyle(color: Colors.white54)),
                Text(
                  receiver.pin,
                  style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, letterSpacing: 6),
                ),
                if (receiver.localIp != null)
                  Text('${receiver.localIp}:$kReceiverPort', style: const TextStyle(color: Colors.white38)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton.icon(
              onPressed: () => context.read<ReceiverProvider>().regeneratePin(),
              icon: const Icon(Icons.refresh),
              label: const Text('새 PIN 발급'),
            ),
          ),
          const Divider(height: 40),
          Card(
            color: _accessibilityEnabled ? null : Colors.orange.withValues(alpha: 0.15),
            child: ListTile(
              leading: Icon(_accessibilityEnabled ? Icons.check_circle : Icons.warning_amber_rounded,
                  color: _accessibilityEnabled ? Colors.greenAccent : Colors.orangeAccent),
              title: const Text('접근성 서비스'),
              subtitle: Text(_accessibilityEnabled
                  ? '홈/뒤로/방향키 명령을 실행할 수 있습니다'
                  : '켜지 않으면 홈/뒤로/방향키 명령이 동작하지 않습니다. 탭하여 설정으로 이동하세요.'),
              onTap: () async {
                await NativeRemoteBridge.instance.openAccessibilitySettings();
                _refreshAccessibility();
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final ReceiverConnectionState state;
  final String? connectedFrom;

  const _StatusChip({required this.state, required this.connectedFrom});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (state) {
      ReceiverConnectionState.idle => ('시작 중...', Colors.white54),
      ReceiverConnectionState.listening => ('연결 대기 중', Colors.amberAccent),
      ReceiverConnectionState.controllerConnected => ('리모컨 연결됨 ($connectedFrom)', Colors.greenAccent),
      ReceiverConnectionState.error => ('서버 오류', Colors.redAccent),
    };
    return Center(
      child: Chip(
        avatar: Icon(Icons.circle, size: 12, color: color),
        label: Text(label),
      ),
    );
  }
}
