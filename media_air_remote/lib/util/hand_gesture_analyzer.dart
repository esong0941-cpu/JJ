import 'dart:math' as math;
import 'dart:typed_data';

/// One camera plane's raw bytes plus the stride needed to index into it.
/// Mirrors the shape of Flutter's `CameraImagePlane` so this file has no
/// dependency on the `camera` package and can be unit-tested on its own.
class PlaneData {
  final Uint8List bytes;
  final int bytesPerRow;
  final int pixelStride;

  const PlaneData({required this.bytes, required this.bytesPerRow, this.pixelStride = 1});

  int at(int x, int y) {
    final index = y * bytesPerRow + x * pixelStride;
    if (index < 0 || index >= bytes.length) return 0;
    return bytes[index];
  }
}

class CameraImageData {
  final int width;
  final int height;
  final PlaneData y;
  final PlaneData u;
  final PlaneData v;

  const CameraImageData({required this.width, required this.height, required this.y, required this.u, required this.v});
}

/// Result of analyzing a single frame: where the hand-like blob is and a
/// rough count of extended fingers (0 = fist ... 5 = open palm), derived
/// from a radial silhouette signature. There is no neural network here —
/// this is classic YCbCr skin-color segmentation + a polar peak count,
/// which is intentionally simple enough to run per-frame in pure Dart.
class HandFrameResult {
  final double centroidX; // normalized 0..1 across the analyzed grid
  final double centroidY;
  final int fingerCount;
  final double blobFraction; // fraction of grid cells classified as skin

  const HandFrameResult({
    required this.centroidX,
    required this.centroidY,
    required this.fingerCount,
    required this.blobFraction,
  });
}

class HandGestureAnalyzer {
  static const int gridW = 64;
  static const int gridH = 48;
  static const double minBlobFraction = 0.025;
  static const double maxBlobFraction = 0.55; // reject "whole frame is skin-colored" false positives

  /// Runs the whole pipeline on one frame. Returns null when no confident
  /// hand-like blob is present.
  HandFrameResult? analyzeFrame(CameraImageData image) {
    final mask = _buildSkinMask(image);
    final largest = _largestComponent(mask);
    if (largest == null) return null;

    final fraction = largest.pixels.length / (gridW * gridH);
    if (fraction < minBlobFraction || fraction > maxBlobFraction) return null;

    final centroid = _centroid(largest.pixels);
    final boundary = _boundary(mask, largest.pixels);
    final fingerCount = _countFingers(boundary, centroid);

    return HandFrameResult(
      centroidX: centroid.$1 / gridW,
      centroidY: centroid.$2 / gridH,
      fingerCount: fingerCount,
      blobFraction: fraction,
    );
  }

  List<List<bool>> _buildSkinMask(CameraImageData image) {
    final mask = List.generate(gridH, (_) => List.filled(gridW, false));
    final strideX = image.width / gridW;
    final strideY = image.height / gridH;

    for (var gy = 0; gy < gridH; gy++) {
      final srcY = (gy * strideY).toInt();
      for (var gx = 0; gx < gridW; gx++) {
        final srcX = (gx * strideX).toInt();
        // U/V planes are subsampled 2x2 in YUV420.
        final cb = image.u.at(srcX ~/ 2, srcY ~/ 2);
        final cr = image.v.at(srcX ~/ 2, srcY ~/ 2);
        final luma = image.y.at(srcX, srcY);
        mask[gy][gx] = _isSkinTone(luma, cb, cr);
      }
    }
    return mask;
  }

  bool _isSkinTone(int y, int cb, int cr) {
    if (y < 40 || y > 235) return false; // too dark / blown out
    return cb >= 77 && cb <= 135 && cr >= 133 && cr <= 180;
  }

  _Component? _largestComponent(List<List<bool>> mask) {
    final visited = List.generate(gridH, (_) => List.filled(gridW, false));
    _Component? best;

    for (var y = 0; y < gridH; y++) {
      for (var x = 0; x < gridW; x++) {
        if (!mask[y][x] || visited[y][x]) continue;
        final pixels = <(int, int)>[];
        final queue = <(int, int)>[(x, y)];
        visited[y][x] = true;
        while (queue.isNotEmpty) {
          final (cx, cy) = queue.removeLast();
          pixels.add((cx, cy));
          for (final (dx, dy) in const [(1, 0), (-1, 0), (0, 1), (0, -1)]) {
            final nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
            if (visited[ny][nx] || !mask[ny][nx]) continue;
            visited[ny][nx] = true;
            queue.add((nx, ny));
          }
        }
        if (best == null || pixels.length > best.pixels.length) {
          best = _Component(pixels);
        }
      }
    }
    return best;
  }

  (double, double) _centroid(List<(int, int)> pixels) {
    var sx = 0.0, sy = 0.0;
    for (final (x, y) in pixels) {
      sx += x;
      sy += y;
    }
    return (sx / pixels.length, sy / pixels.length);
  }

  List<(int, int)> _boundary(List<List<bool>> mask, List<(int, int)> pixels) {
    final set = pixels.toSet();
    final boundary = <(int, int)>[];
    for (final (x, y) in pixels) {
      var isEdge = x == 0 || y == 0 || x == gridW - 1 || y == gridH - 1;
      if (!isEdge) {
        for (final (dx, dy) in const [(1, 0), (-1, 0), (0, 1), (0, -1)]) {
          if (!set.contains((x + dx, y + dy))) {
            isEdge = true;
            break;
          }
        }
      }
      if (isEdge) boundary.add((x, y));
    }
    return boundary;
  }

  /// Buckets boundary points into angular bins around the centroid and
  /// counts prominent local-maxima "spikes" in the radial profile — each
  /// spike approximates one extended finger (the classic radial-signature
  /// finger-counting technique).
  int _countFingers(List<(int, int)> boundary, (double, double) centroid) {
    if (boundary.length < 8) return 0;
    const bins = 72; // 5 degrees each
    final maxRadius = List<double>.filled(bins, 0);
    final (cx, cy) = centroid;

    var meanRadius = 0.0;
    for (final (x, y) in boundary) {
      final dx = x - cx, dy = y - cy;
      final r = math.sqrt(dx * dx + dy * dy);
      meanRadius += r;
      final angle = math.atan2(dy, dx); // -pi..pi
      final bin = (((angle + math.pi) / (2 * math.pi)) * bins).floor().clamp(0, bins - 1);
      if (r > maxRadius[bin]) maxRadius[bin] = r;
    }
    meanRadius /= boundary.length;
    if (meanRadius <= 0) return 0;

    final threshold = meanRadius * 1.22;
    final isPeakBin = List<bool>.filled(bins, false);
    for (var i = 0; i < bins; i++) {
      final prev = maxRadius[(i - 1 + bins) % bins];
      final next = maxRadius[(i + 1) % bins];
      if (maxRadius[i] > threshold && maxRadius[i] >= prev && maxRadius[i] >= next) {
        isPeakBin[i] = true;
      }
    }

    // Merge adjacent peak bins (same finger spans multiple 5-degree bins).
    var count = 0;
    for (var i = 0; i < bins; i++) {
      if (isPeakBin[i] && !isPeakBin[(i - 1 + bins) % bins]) count++;
    }
    return count.clamp(0, 5);
  }
}

class _Component {
  final List<(int, int)> pixels;
  const _Component(this.pixels);
}
