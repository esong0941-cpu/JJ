import 'dart:math';

import 'package:flutter/foundation.dart';

import '../native/native_remote_bridge.dart';
import '../network/receiver_server.dart';

const int kReceiverPort = 58217;

/// Owns the [ReceiverServer] lifecycle when this device is running in
/// "수신기 모드" (i.e. this is the TV box / secondary Android device being
/// controlled by another phone).
class ReceiverProvider extends ChangeNotifier {
  ReceiverServer? _server;
  String pin = _generatePin();
  String? localIp;
  String deviceName = 'Android Device';
  ReceiverConnectionState state = ReceiverConnectionState.idle;
  String? connectedFrom;

  static String _generatePin() {
    final rnd = Random.secure();
    return List.generate(6, (_) => rnd.nextInt(10)).join();
  }

  Future<void> start() async {
    localIp = await NativeRemoteBridge.instance.localIpAddress();
    deviceName = await NativeRemoteBridge.instance.deviceName();
    _server = ReceiverServer(
      port: kReceiverPort,
      pin: pin,
      onStateChanged: (s, {remote}) {
        state = s;
        if (s == ReceiverConnectionState.controllerConnected) {
          connectedFrom = remote;
        } else if (s == ReceiverConnectionState.listening) {
          connectedFrom = null;
        }
        notifyListeners();
      },
    );
    await _server!.start();
    await NativeRemoteBridge.instance.startReceiverForegroundService();
    notifyListeners();
  }

  void regeneratePin() {
    pin = _generatePin();
    _server?.stop();
    start();
  }

  Future<void> stop() async {
    await _server?.stop();
    _server = null;
    state = ReceiverConnectionState.idle;
    await NativeRemoteBridge.instance.stopReceiverForegroundService();
    notifyListeners();
  }

  @override
  void dispose() {
    _server?.stop();
    super.dispose();
  }
}
