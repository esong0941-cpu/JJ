import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../native/native_remote_bridge.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/library_provider.dart';
import '../../providers/orientation_provider.dart';
import '../pairing/device_list_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _accessibilityEnabled = false;
  final _channelCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void dispose() {
    _channelCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    final enabled = await NativeRemoteBridge.instance.isAccessibilityServiceEnabled();
    if (mounted) setState(() => _accessibilityEnabled = enabled);
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryProvider>();
    final orientation = context.watch<OrientationProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('설정')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _SectionLabel('조작 대상'),
          Card(
            child: ListTile(
              leading: const Icon(Icons.cast),
              title: const Text('기기 관리'),
              subtitle: const Text('이 기기를 제어할지, 다른 기기를 페어링해서 제어할지 선택'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DeviceListScreen())),
            ),
          ),
          const SizedBox(height: 20),
          const _SectionLabel('스마트 모드'),
          Card(
            child: SwitchListTile(
              title: const Text('가로로 들면 자동 리모컨'),
              subtitle: const Text('휴대폰을 가로로 들면 리모컨 화면, 세로로 들면 앱 선택 화면으로 자동 전환합니다'),
              value: orientation.smartModeEnabled,
              onChanged: (v) => v ? orientation.enable() : orientation.disable(),
            ),
          ),
          const SizedBox(height: 20),
          const _SectionLabel('접근성 서비스 (이 기기)'),
          Card(
            color: _accessibilityEnabled ? null : Colors.orange.withValues(alpha: 0.15),
            child: ListTile(
              leading: Icon(_accessibilityEnabled ? Icons.check_circle : Icons.warning_amber_rounded,
                  color: _accessibilityEnabled ? Colors.greenAccent : Colors.orangeAccent),
              title: const Text('홈/뒤로/방향키 제어 권한'),
              subtitle: Text(_accessibilityEnabled ? '켜짐' : '꺼짐 — 이 기기를 직접 제어하려면 켜야 합니다'),
              onTap: () async {
                await NativeRemoteBridge.instance.openAccessibilitySettings();
                _refresh();
              },
            ),
          ),
          const SizedBox(height: 20),
          const _SectionLabel('즐겨찾기 채널'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final ch in library.favoriteChannels)
                        InputChip(
                          label: Text('$ch번'),
                          onDeleted: () => library.removeFavoriteChannel(ch),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _channelCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: '채널 번호 추가', isDense: true),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: () {
                          final v = _channelCtrl.text.trim();
                          if (v.isNotEmpty) {
                            library.addFavoriteChannel(v);
                            _channelCtrl.clear();
                          }
                        },
                        child: const Text('추가'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          const _SectionLabel('기기 모드'),
          Card(
            child: ListTile(
              leading: const Icon(Icons.swap_horiz),
              title: const Text('리모컨 ↔ 수신기 모드 전환'),
              subtitle: const Text('이 앱을 리모컨(휴대폰)으로 쓸지, 수신기(TV박스)로 쓸지 다시 선택합니다'),
              onTap: () => context.read<AppModeProvider>().setMode(AppMode.unset),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text, style: const TextStyle(color: Colors.white54, fontSize: 12)),
    );
  }
}
