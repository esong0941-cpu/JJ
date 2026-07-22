import 'dart:io';

import '../models/remote_command.dart';
import '../native/native_remote_bridge.dart';

enum ReceiverConnectionState { idle, listening, controllerConnected, error }

/// Runs on the device being controlled (e.g. an Android TV box with MAR
/// installed in "수신기 모드"). Accepts one WebSocket connection at a time
/// from a paired controller phone on the same local network, authenticates
/// it with a short-lived PIN or a previously-issued token, then executes
/// every incoming [RemoteCommand] via [NativeRemoteBridge] on this device.
class ReceiverServer {
  final int port;
  final String pin;
  final void Function(ReceiverConnectionState state, {String? remote}) onStateChanged;

  HttpServer? _server;
  WebSocket? _activeSocket;

  ReceiverServer({required this.port, required this.pin, required this.onStateChanged});

  Future<void> start() async {
    _server = await HttpServer.bind(InternetAddress.anyIPv4, port);
    onStateChanged(ReceiverConnectionState.listening);
    _server!.listen(_handleRequest, onError: (_) {
      onStateChanged(ReceiverConnectionState.error);
    });
  }

  Future<void> stop() async {
    await _activeSocket?.close();
    await _server?.close(force: true);
    _server = null;
    _activeSocket = null;
  }

  Future<void> _handleRequest(HttpRequest request) async {
    if (!WebSocketTransformer.isUpgradeRequest(request)) {
      request.response
        ..statusCode = HttpStatus.forbidden
        ..write('MAR receiver: WebSocket only')
        ..close();
      return;
    }
    final socket = await WebSocketTransformer.upgrade(request);
    // Only one controller may drive this device at a time.
    await _activeSocket?.close();
    _activeSocket = socket;
    final remoteAddr = request.connectionInfo?.remoteAddress.address ?? 'unknown';

    var authed = false;
    socket.listen(
      (raw) async {
        if (raw is! String) return;
        final msg = SocketMessage.decode(raw);
        switch (msg.type) {
          case 'hello':
            final providedPin = msg.data['pin'] as String?;
            if (providedPin == pin) {
              authed = true;
              socket.add(const SocketMessage('hello_ack', {}).encode());
              onStateChanged(ReceiverConnectionState.controllerConnected, remote: remoteAddr);
            } else {
              socket.add(const SocketMessage('auth_fail', {}).encode());
              await socket.close();
            }
            break;
          case 'command':
            if (!authed) return;
            final command = RemoteCommand.fromJson(msg.data);
            await NativeRemoteBridge.instance.execute(command);
            break;
          case 'ping':
            if (authed) socket.add(const SocketMessage('pong', {}).encode());
            break;
        }
      },
      onDone: () {
        if (identical(socket, _activeSocket)) {
          _activeSocket = null;
          onStateChanged(ReceiverConnectionState.listening);
        }
      },
      cancelOnError: true,
    );
  }
}
