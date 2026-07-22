import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:media_air_remote/util/hand_gesture_analyzer.dart';

/// Builds a synthetic YUV420 frame at grid resolution (64x48 luma, 32x24
/// chroma) so [HandGestureAnalyzer] can be exercised without a real camera.
/// [skinAt] decides, in chroma-plane coordinates (32x24), whether a cell is
/// skin-toned.
CameraImageData buildFrame(bool Function(int x, int y) skinAt) {
  const w = 64, h = 48, cw = 32, ch = 24;
  final y = Uint8List(w * h)..fillRange(0, w * h, 150);
  final u = Uint8List(cw * ch);
  final v = Uint8List(cw * ch);
  for (var cy = 0; cy < ch; cy++) {
    for (var cx = 0; cx < cw; cx++) {
      final skin = skinAt(cx, cy);
      u[cy * cw + cx] = skin ? 100 : 0; // Cb in-range vs clearly out of range
      v[cy * cw + cx] = skin ? 150 : 0; // Cr in-range vs clearly out of range
    }
  }
  return CameraImageData(
    width: w,
    height: h,
    y: PlaneData(bytes: y, bytesPerRow: w),
    u: PlaneData(bytes: u, bytesPerRow: cw),
    v: PlaneData(bytes: v, bytesPerRow: cw),
  );
}

bool withinDisk(int x, int y, int cx, int cy, double r) {
  final dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

void main() {
  final analyzer = HandGestureAnalyzer();

  test('empty frame yields no hand', () {
    final frame = buildFrame((x, y) => false);
    expect(analyzer.analyzeFrame(frame), isNull);
  });

  test('a compact disk (fist) is detected with a low finger count', () {
    final frame = buildFrame((x, y) => withinDisk(x, y, 16, 12, 6));
    final result = analyzer.analyzeFrame(frame);
    expect(result, isNotNull);
    expect(result!.fingerCount, lessThanOrEqualTo(1));
    expect(result.centroidX, closeTo(16 / 32, 0.1));
    expect(result.centroidY, closeTo(12 / 24, 0.1));
  });

  test('a disk with 5 radial spikes (open palm) yields a high finger count', () {
    const cx = 16, cy = 12;
    bool skinAt(int x, int y) {
      if (withinDisk(x, y, cx, cy, 4)) return true;
      // Five thin spikes radiating outward, evenly spaced.
      for (var i = 0; i < 5; i++) {
        final angle = (2 * math.pi / 5) * i;
        for (var r = 4.0; r <= 11.0; r += 0.5) {
          final px = (cx + r * math.cos(angle)).round();
          final py = (cy + r * math.sin(angle)).round();
          if (x == px && y == py) return true;
          // widen the spike by one cell so it survives 5-degree binning
          if (x == px + 1 && y == py) return true;
        }
      }
      return false;
    }

    final frame = buildFrame(skinAt);
    final result = analyzer.analyzeFrame(frame);
    expect(result, isNotNull);
    expect(result!.fingerCount, greaterThanOrEqualTo(3));
  });
}
