import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/remote_command.dart';
import '../../providers/remote_executor.dart';
import '../../widgets/device_link_banner.dart';
import '../../widgets/dpad_widget.dart';

class RemoteScreen extends StatelessWidget {
  const RemoteScreen({super.key});

  void _send(BuildContext context, RemoteAction action) {
    context.read<RemoteExecutor>().send(RemoteCommand(action));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('리모컨'),
        actions: const [Padding(padding: EdgeInsets.only(right: 12), child: Center(child: DeviceLinkBanner()))],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              DpadWidget(
                onUp: () => _send(context, RemoteAction.dpadUp),
                onDown: () => _send(context, RemoteAction.dpadDown),
                onLeft: () => _send(context, RemoteAction.dpadLeft),
                onRight: () => _send(context, RemoteAction.dpadRight),
                onCenter: () => _send(context, RemoteAction.dpadCenter),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _TextButton('홈', Icons.home_outlined, () => _send(context, RemoteAction.home)),
                  _TextButton('뒤로', Icons.arrow_back, () => _send(context, RemoteAction.back)),
                  _TextButton('메뉴', Icons.menu, () => _send(context, RemoteAction.recents)),
                ],
              ),
              const Divider(height: 32),
              Row(
                children: [
                  Expanded(
                    child: _RockerGroup(
                      label: '채널',
                      onPlus: () => _send(context, RemoteAction.channelUp),
                      onMinus: () => _send(context, RemoteAction.channelDown),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _RockerGroup(
                      label: '볼륨',
                      onPlus: () => _send(context, RemoteAction.volumeUp),
                      onMinus: () => _send(context, RemoteAction.volumeDown),
                    ),
                  ),
                ],
              ),
              const Divider(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _TextButton('뒤로10초', Icons.replay_10, () => _send(context, RemoteAction.seekBackward10)),
                  _TextButton('재생/정지', Icons.play_arrow, () => _send(context, RemoteAction.mediaPlayPause)),
                  _TextButton('앞으로10초', Icons.forward_10, () => _send(context, RemoteAction.seekForward10)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RockerGroup extends StatelessWidget {
  final String label;
  final VoidCallback onPlus;
  final VoidCallback onMinus;

  const _RockerGroup({required this.label, required this.onPlus, required this.onMinus});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Padding(padding: const EdgeInsets.only(top: 8), child: Text(label, style: const TextStyle(color: Colors.white70))),
          IconButton(iconSize: 32, onPressed: onPlus, icon: const Icon(Icons.add_circle_outline)),
          IconButton(iconSize: 32, onPressed: onMinus, icon: const Icon(Icons.remove_circle_outline)),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _TextButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _TextButton(this.label, this.icon, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton.filledTonal(onPressed: onTap, icon: Icon(icon)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
