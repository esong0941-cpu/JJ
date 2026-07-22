import 'dart:async';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../models/paired_device.dart';
import '../models/remote_command.dart';

enum ControllerLinkState { disconnected, connecting, connected, authFailed }

/// Runs on the controller phone. Connects to a receiver device's
/// [ReceiverServer] over local Wi-Fi and streams [RemoteCommand]s to it,
/// so the phone can drive a second Android device (e.g. a TV box) instead
/// of only itself.
class ControllerClient {
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _keepAlive;

  final _stateController = StreamController<ControllerLinkState>.broadcast();
  Stream<ControllerLinkState> get stateStream => _stateController.stream;
  ControllerLinkState state = ControllerLinkState.disconnected;

  PairedDevice? currentDevice;

  void _setState(ControllerLinkState s) {
    state = s;
    _stateController.add(s);
  }

  /// Connects using either a fresh [pin] (first-time pairing) or the stored
  /// [token] from a previous pairing.
  Future<bool> connect(PairedDevice device, {String? pin}) async {
    await disconnect();
    _setState(ControllerLinkState.connecting);
    try {
      final uri = Uri.parse('ws://${device.host}:${device.port}');
      final channel = WebSocketChannel.connect(uri);
      await channel.ready;
      _channel = channel;
      currentDevice = device;

      final authCompleter = Completer<bool>();
      _sub = channel.stream.listen(
        (raw) {
          if (raw is! String) return;
          final msg = SocketMessage.decode(raw);
          if (msg.type == 'hello_ack' && !authCompleter.isCompleted) {
            authCompleter.complete(true);
          } else if (msg.type == 'auth_fail' && !authCompleter.isCompleted) {
            authCompleter.complete(false);
          }
        },
        onDone: () => _setState(ControllerLinkState.disconnected),
        onError: (_) => _setState(ControllerLinkState.disconnected),
      );

      channel.sink.add(SocketMessage('hello', {'pin': pin ?? device.token}).encode());
      final ok = await authCompleter.future.timeout(
        const Duration(seconds: 6),
        onTimeout: () => false,
      );
      if (ok) {
        _setState(ControllerLinkState.connected);
        _keepAlive = Timer.periodic(const Duration(seconds: 20), (_) {
          _channel?.sink.add(const SocketMessage('ping', {}).encode());
        });
      } else {
        _setState(ControllerLinkState.authFailed);
        await disconnect();
      }
      return ok;
    } catch (_) {
      _setState(ControllerLinkState.disconnected);
      return false;
    }
  }

  void send(RemoteCommand command) {
    if (state != ControllerLinkState.connected) return;
    _channel?.sink.add(SocketMessage('command', command.toJson()).encode());
  }

  Future<void> disconnect() async {
    _keepAlive?.cancel();
    await _sub?.cancel();
    await _channel?.sink.close();
    _channel = null;
    _sub = null;
    _keepAlive = null;
    if (state != ControllerLinkState.authFailed) {
      _setState(ControllerLinkState.disconnected);
    }
  }

  void dispose() {
    disconnect();
    _stateController.close();
  }
}
