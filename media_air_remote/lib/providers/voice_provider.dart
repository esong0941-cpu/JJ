import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../models/ott_app.dart';
import '../models/remote_command.dart';

/// Parsed outcome of a recognized voice utterance: either a remote command
/// to send, or an app to launch, or nothing recognized.
class VoiceIntent {
  final RemoteCommand? command;
  final OttApp? appToLaunch;
  final String heardText;

  const VoiceIntent({this.command, this.appToLaunch, required this.heardText});

  bool get isEmpty => command == null && appToLaunch == null;
}

/// Wraps [speech_to_text] and maps recognized Korean phrases from the spec
/// ("11번", "넷플릭스", "다음", "멈춰", "소리줄여", "30분 뒤 종료") onto
/// [RemoteCommand]s / app launches.
class VoiceProvider extends ChangeNotifier {
  final stt.SpeechToText _speech = stt.SpeechToText();

  bool available = false;
  bool listening = false;
  String lastHeard = '';
  VoiceIntent? lastIntent;
  Duration? pendingTimer;

  Future<bool> init() async {
    available = await _speech.initialize(
      onStatus: (status) {
        listening = status == 'listening';
        notifyListeners();
      },
      onError: (_) {
        listening = false;
        notifyListeners();
      },
    );
    notifyListeners();
    return available;
  }

  Future<void> startListening() async {
    if (!available) return;
    await _speech.listen(
      onResult: (result) {
        lastHeard = result.recognizedWords;
        if (result.finalResult) {
          lastIntent = parseUtterance(lastHeard);
        }
        notifyListeners();
      },
      listenOptions: stt.SpeechListenOptions(partialResults: true, localeId: 'ko_KR'),
    );
    listening = true;
    notifyListeners();
  }

  Future<void> stopListening() async {
    await _speech.stop();
    listening = false;
    notifyListeners();
  }

  @visibleForTesting
  VoiceIntent parseUtterance(String text) {
    final t = text.replaceAll(' ', '');

    // App names.
    for (final app in OttApp.catalog) {
      final aliases = _appAliases[app.id] ?? [app.label];
      if (aliases.any((a) => t.contains(a))) {
        return VoiceIntent(appToLaunch: app, heardText: text);
      }
    }

    // Direct channel number, e.g. "11번".
    final channelMatch = RegExp(r'(\d{1,4})번').firstMatch(t);
    if (channelMatch != null) {
      return VoiceIntent(
        command: RemoteCommand(RemoteAction.enterChannelNumber, payload: channelMatch.group(1)),
        heardText: text,
      );
    }

    if (t.contains('다음') || t.contains('다음채널')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.channelUp), heardText: text);
    }
    if (t.contains('이전')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.channelDown), heardText: text);
    }
    if (t.contains('멈춰') || t.contains('일시정지') || t.contains('재생')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.mediaPlayPause), heardText: text);
    }
    if (t.contains('소리줄여') || t.contains('볼륨낮춰') || t.contains('음량줄여')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.volumeDown), heardText: text);
    }
    if (t.contains('소리키워') || t.contains('볼륨높여') || t.contains('음량높여')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.volumeUp), heardText: text);
    }
    if (t.contains('음소거')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.mute), heardText: text);
    }
    if (t.contains('홈')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.home), heardText: text);
    }
    if (t.contains('뒤로')) {
      return VoiceIntent(command: const RemoteCommand(RemoteAction.back), heardText: text);
    }

    final timerMatch = RegExp(r'(\d{1,3})분\s*(뒤|후)\s*(종료|꺼줘|정지)').firstMatch(text);
    if (timerMatch != null) {
      pendingTimer = Duration(minutes: int.parse(timerMatch.group(1)!));
      return VoiceIntent(heardText: text);
    }

    return VoiceIntent(heardText: text);
  }

  static const _appAliases = {
    'btv': ['비티비', 'b tv', 'btv', '비티비에어'],
    'netflix': ['넷플릭스', 'netflix'],
    'tving': ['티빙', 'tving'],
    'wavve': ['웨이브', 'wavve'],
    'disney': ['디즈니', 'disney'],
    'coupangplay': ['쿠팡플레이', '쿠팡', 'coupangplay'],
  };
}
