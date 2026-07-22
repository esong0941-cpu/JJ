import 'package:flutter/foundation.dart';

import '../db/app_database.dart';
import '../models/paired_device.dart';
import '../models/remote_command.dart';
import '../native/native_remote_bridge.dart';
import '../network/controller_client.dart';

/// The single entry point every screen (remote pad, gesture mode, voice
/// mode, dishwashing mode) uses to actually issue a remote-control action.
///
/// If no other Android device is paired/selected, actions run on THIS
/// device via [NativeRemoteBridge]. If a paired receiver device is
/// selected and connected, actions are instead sent over the network via
/// [ControllerClient] and executed on that other device.
class RemoteExecutor extends ChangeNotifier {
  final ControllerClient _client = ControllerClient();
  PairedDevice? _target;

  PairedDevice? get target => _target;
  ControllerLinkState get linkState => _client.state;
  Stream<ControllerLinkState> get linkStream => _client.stateStream;

  RemoteExecutor() {
    _client.stateStream.listen((_) => notifyListeners());
  }

  bool get isControllingRemoteDevice =>
      _target != null && _client.state == ControllerLinkState.connected;

  Future<bool> connectTo(PairedDevice device, {String? pin}) async {
    _target = device;
    final ok = await _client.connect(device, pin: pin);
    if (ok) {
      await AppDatabase.instance.upsertPairedDevice(
        device.copyWith(lastConnected: DateTime.now()),
      );
    }
    notifyListeners();
    return ok;
  }

  Future<void> controlThisDeviceInstead() async {
    _target = null;
    await _client.disconnect();
    notifyListeners();
  }

  Future<void> send(RemoteCommand command) async {
    if (isControllingRemoteDevice) {
      _client.send(command);
    } else {
      await NativeRemoteBridge.instance.execute(command);
    }
  }

  Future<void> launchApp(String packageName) async {
    if (isControllingRemoteDevice) {
      _client.send(RemoteCommand(RemoteAction.launchApp, payload: packageName));
    } else {
      await NativeRemoteBridge.instance.launchApp(packageName);
    }
  }

  @override
  void dispose() {
    _client.dispose();
    super.dispose();
  }
}
