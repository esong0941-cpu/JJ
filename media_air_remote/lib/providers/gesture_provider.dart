import 'dart:async';
import 'dart:collection';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';

import '../util/hand_gesture_analyzer.dart';

enum HandGesture { palm, fist, thumbUp, vSign, swipeLeft, swipeRight }

/// Drives the camera, feeds frames to [HandGestureAnalyzer], tracks the
/// hand centroid over time to detect swipes, and debounces raw per-frame
/// results into discrete [HandGesture] events a screen can react to.
///
/// Accuracy note: this uses classic YCbCr skin-color segmentation, not a
/// trained ML model (Google ML Kit has no hand-gesture API). It works best
/// against a plain background with good, even lighting.
class GestureProvider extends ChangeNotifier {
  final HandGestureAnalyzer _analyzer = HandGestureAnalyzer();
  CameraController? _controller;
  bool _busy = false;
  DateTime _lastEmit = DateTime.fromMillisecondsSinceEpoch(0);

  final Queue<double> _centroidHistory = Queue<double>();
  static const _historyLen = 8;
  static const _cooldown = Duration(milliseconds: 900);

  bool active = false;
  HandFrameResult? lastFrame;
  HandGesture? lastGesture;
  final _gestureController = StreamController<HandGesture>.broadcast();
  Stream<HandGesture> get gestureStream => _gestureController.stream;

  CameraController? get controller => _controller;

  Future<void> start() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    final front = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    final controller = CameraController(
      front,
      ResolutionPreset.low,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.yuv420,
    );
    await controller.initialize();
    _controller = controller;
    active = true;
    _centroidHistory.clear();
    await controller.startImageStream(_onFrame);
    notifyListeners();
  }

  Future<void> stop() async {
    active = false;
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      if (controller.value.isStreamingImages) {
        await controller.stopImageStream();
      }
      await controller.dispose();
    }
    notifyListeners();
  }

  void _onFrame(CameraImage image) {
    if (_busy || !active) return;
    _busy = true;
    try {
      final data = _toImageData(image);
      final result = _analyzer.analyzeFrame(data);
      lastFrame = result;
      if (result != null) {
        _centroidHistory.addLast(result.centroidX);
        if (_centroidHistory.length > _historyLen) _centroidHistory.removeFirst();
        _evaluate(result);
      } else {
        _centroidHistory.clear();
      }
      notifyListeners();
    } catch (_) {
      // Malformed frame (rotation/plane edge cases) — just skip it.
    } finally {
      _busy = false;
    }
  }

  void _evaluate(HandFrameResult result) {
    final now = DateTime.now();
    if (now.difference(_lastEmit) < _cooldown) return;

    // Swipe: enough centroid samples, mostly-monotonic horizontal motion.
    if (_centroidHistory.length >= _historyLen) {
      final first = _centroidHistory.first;
      final last = _centroidHistory.last;
      final delta = last - first;
      if (delta.abs() > 0.28) {
        _emit(delta > 0 ? HandGesture.swipeRight : HandGesture.swipeLeft);
        return;
      }
    }

    switch (result.fingerCount) {
      case 0:
        _emit(HandGesture.fist);
        break;
      case 1:
        _emit(HandGesture.thumbUp);
        break;
      case 2:
        _emit(HandGesture.vSign);
        break;
      case 4:
      case 5:
        _emit(HandGesture.palm);
        break;
      default:
        break;
    }
  }

  void _emit(HandGesture gesture) {
    _lastEmit = DateTime.now();
    lastGesture = gesture;
    _centroidHistory.clear();
    _gestureController.add(gesture);
  }

  CameraImageData _toImageData(CameraImage image) {
    final planes = image.planes;
    return CameraImageData(
      width: image.width,
      height: image.height,
      y: PlaneData(bytes: planes[0].bytes, bytesPerRow: planes[0].bytesPerRow, pixelStride: planes[0].bytesPerPixel ?? 1),
      u: PlaneData(bytes: planes[1].bytes, bytesPerRow: planes[1].bytesPerRow, pixelStride: planes[1].bytesPerPixel ?? 1),
      v: PlaneData(bytes: planes[2].bytes, bytesPerRow: planes[2].bytesPerRow, pixelStride: planes[2].bytesPerPixel ?? 1),
    );
  }

  @override
  void dispose() {
    stop();
    _gestureController.close();
    super.dispose();
  }
}
