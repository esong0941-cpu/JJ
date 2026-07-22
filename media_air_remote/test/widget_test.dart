import 'package:flutter_test/flutter_test.dart';
import 'package:media_air_remote/providers/voice_provider.dart';

void main() {
  group('VoiceProvider.parseUtterance', () {
    final voice = VoiceProvider();

    test('recognizes app name', () {
      final intent = voice.parseUtterance('넷플릭스');
      expect(intent.appToLaunch?.id, 'netflix');
    });

    test('recognizes channel number', () {
      final intent = voice.parseUtterance('11번');
      expect(intent.command?.payload, '11');
    });

    test('recognizes play/pause phrase', () {
      final intent = voice.parseUtterance('멈춰');
      expect(intent.command, isNotNull);
    });

    test('recognizes timer phrase', () {
      voice.parseUtterance('30분 뒤 종료');
      expect(voice.pendingTimer, const Duration(minutes: 30));
    });
  });
}
