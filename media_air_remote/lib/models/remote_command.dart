import 'dart:convert';

/// Actions that can be executed either locally (same device) or remotely
/// (sent over the network to a paired receiver device).
enum RemoteAction {
  dpadUp,
  dpadDown,
  dpadLeft,
  dpadRight,
  dpadCenter,
  back,
  home,
  recents,
  channelUp,
  channelDown,
  volumeUp,
  volumeDown,
  mute,
  mediaPlayPause,
  mediaNext,
  mediaPrevious,
  seekForward10,
  seekBackward10,
  launchApp,
  lockScreen,
  /// Best-effort: searches the foreground app's on-screen numeric keypad
  /// for the digits in [RemoteCommand.payload] and taps them in order via
  /// the accessibility service. Works only for apps that show a tappable
  /// numeric keypad (e.g. a channel-number entry screen); not guaranteed.
  enterChannelNumber,
}

extension RemoteActionWire on RemoteAction {
  String get wire => name;

  static RemoteAction fromWire(String s) =>
      RemoteAction.values.firstWhere((e) => e.name == s, orElse: () => RemoteAction.dpadCenter);
}

/// One command sent controller -> receiver over the pairing socket.
/// [payload] carries extra data, e.g. the Android package name for launchApp.
class RemoteCommand {
  final RemoteAction action;
  final String? payload;

  const RemoteCommand(this.action, {this.payload});

  Map<String, dynamic> toJson() => {
        'type': 'command',
        'action': action.wire,
        if (payload != null) 'payload': payload,
      };

  String encode() => jsonEncode(toJson());

  static RemoteCommand fromJson(Map<String, dynamic> json) => RemoteCommand(
        RemoteActionWire.fromWire(json['action'] as String),
        payload: json['payload'] as String?,
      );
}

/// Envelope for every message on the pairing socket so receiver/controller
/// can distinguish handshake, commands, and status pings.
class SocketMessage {
  final String type; // hello | hello_ack | auth_fail | command | pong | ping
  final Map<String, dynamic> data;

  const SocketMessage(this.type, this.data);

  String encode() => jsonEncode({'type': type, ...data});

  static SocketMessage decode(String raw) {
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final type = map['type'] as String? ?? 'unknown';
    return SocketMessage(type, map);
  }
}
