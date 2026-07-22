import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../db/app_database.dart';
import '../../models/paired_device.dart';
import '../../providers/remote_executor.dart';
import 'scan_pair_screen.dart';

class DeviceListScreen extends StatefulWidget {
  const DeviceListScreen({super.key});

  @override
  State<DeviceListScreen> createState() => _DeviceListScreenState();
}

class _DeviceListScreenState extends State<DeviceListScreen> {
  List<PairedDevice> _devices = [];
  bool _connecting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final devices = await AppDatabase.instance.pairedDevices();
    if (mounted) setState(() => _devices = devices);
  }

  @override
  Widget build(BuildContext context) {
    final executor = context.watch<RemoteExecutor>();

    return Scaffold(
      appBar: AppBar(title: const Text('조작 대상 기기')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: executor.target == null ? Theme.of(context).colorScheme.primaryContainer : null,
            child: ListTile(
              leading: const Icon(Icons.smartphone),
              title: const Text('이 기기 (직접 제어)'),
              subtitle: const Text('휴대폰 자체의 볼륨/미디어를 제어합니다'),
              trailing: executor.target == null ? const Icon(Icons.check_circle) : null,
              onTap: () async {
                await context.read<RemoteExecutor>().controlThisDeviceInstead();
              },
            ),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child: Text('페어링된 기기', style: TextStyle(color: Colors.white54, fontSize: 12)),
          ),
          if (_devices.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text('아직 페어링된 기기가 없습니다.\n아래 버튼으로 TV박스 등 다른 기기를 추가하세요.',
                    textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
              ),
            ),
          for (final device in _devices)
            Card(
              color: executor.target?.host == device.host && executor.target?.port == device.port
                  ? Theme.of(context).colorScheme.primaryContainer
                  : null,
              child: ListTile(
                leading: const Icon(Icons.tv),
                title: Text(device.name),
                subtitle: Text('${device.host}:${device.port}'),
                trailing: _connecting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          if (device.id != null) await AppDatabase.instance.removePairedDevice(device.id!);
                          _load();
                        },
                      ),
                onTap: () async {
                  setState(() => _connecting = true);
                  final ok = await context.read<RemoteExecutor>().connectTo(device);
                  if (!mounted) return;
                  setState(() => _connecting = false);
                  if (!ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('연결에 실패했습니다. 두 기기가 같은 와이파이에 있는지 확인하세요.')),
                    );
                  }
                },
              ),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('기기 추가 (QR/PIN)'),
        onPressed: () async {
          final paired = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const ScanPairScreen()),
          );
          if (paired == true) _load();
        },
      ),
    );
  }
}
