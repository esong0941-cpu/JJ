import 'package:flutter/services.dart';

import '../models/remote_command.dart';

/// Executes a [RemoteCommand] on THIS device via the native Android side
/// (MainActivity.kt + RemoteAccessibilityService.kt). Used both when the
/// phone controls its own screen directly, and on a receiver device that
/// just got a command over the network from a paired controller.
class NativeRemoteBridge {
  NativeRemoteBridge._();
  static final NativeRemoteBridge instance = NativeRemoteBridge._();

  static const _channel = MethodChannel('media_air_remote/native');

  Future<bool> isAccessibilityServiceEnabled() async {
    final res = await _channel.invokeMethod<bool>('isAccessibilityServiceEnabled');
    return res ?? false;
  }

  Future<void> openAccessibilitySettings() async {
    await _channel.invokeMethod('openAccessibilitySettings');
  }

  Future<List<String>> installedPackages(List<String> candidates) async {
    final res = await _channel.invokeMethod<List<Object?>>('installedPackages', {
      'candidates': candidates,
    });
    return res?.whereType<String>().toList() ?? const [];
  }

  Future<bool> launchApp(String packageName) async {
    final res = await _channel.invokeMethod<bool>('launchApp', {'packageName': packageName});
    return res ?? false;
  }

  Future<bool> execute(RemoteCommand command) async {
    final res = await _channel.invokeMethod<bool>('executeCommand', {
      'action': command.action.wire,
      'payload': command.payload,
    });
    return res ?? false;
  }

  Future<String?> localIpAddress() async {
    return _channel.invokeMethod<String>('localIpAddress');
  }

  Future<String> deviceName() async {
    final res = await _channel.invokeMethod<String>('deviceName');
    return res ?? 'Android Device';
  }

  Future<void> startReceiverForegroundService() async {
    await _channel.invokeMethod('startReceiverForegroundService');
  }

  Future<void> stopReceiverForegroundService() async {
    await _channel.invokeMethod('stopReceiverForegroundService');
  }
}
