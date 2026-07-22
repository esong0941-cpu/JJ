import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../network/controller_client.dart';
import '../providers/remote_executor.dart';
import '../screens/pairing/device_list_screen.dart';

/// Small tappable strip shown on the controller's Home/Remote screens that
/// says which device is currently being controlled: this phone itself, or
/// a paired receiver device over the network.
class DeviceLinkBanner extends StatelessWidget {
  const DeviceLinkBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final executor = context.watch<RemoteExecutor>();
    final target = executor.target;
    final connected = executor.isControllingRemoteDevice;

    final String label;
    final IconData icon;
    final Color color;
    if (target == null) {
      label = '이 기기를 직접 제어 중';
      icon = Icons.smartphone;
      color = Colors.white70;
    } else if (connected) {
      label = '${target.name} 제어 중';
      icon = Icons.cast_connected;
      color = Colors.greenAccent;
    } else if (executor.linkState == ControllerLinkState.connecting) {
      label = '${target.name}에 연결 중...';
      icon = Icons.sync;
      color = Colors.amberAccent;
    } else {
      label = '${target.name} 연결 끊김';
      icon = Icons.cast;
      color = Colors.redAccent;
    }

    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const DeviceListScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 12, color: color)),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 16, color: Colors.white38),
          ],
        ),
      ),
    );
  }
}
