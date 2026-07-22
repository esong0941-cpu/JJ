import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sensors_plus/sensors_plus.dart';

enum PhysicalOrientation { portrait, landscape }

/// "스마트 모드": watches the accelerometer directly (not the UI orientation
/// lock) so tilting the phone sideways switches to the remote screen and
/// holding it upright switches back to the app-picker, even if some other
/// screen has locked portrait orientation.
class OrientationProvider extends ChangeNotifier {
  static const _landscapeThreshold = 6.0; // m/s^2 on X axis, empirically stable

  StreamSubscription<AccelerometerEvent>? _sub;
  PhysicalOrientation orientation = PhysicalOrientation.portrait;
  bool smartModeEnabled = false;

  void enable() {
    smartModeEnabled = true;
    _sub ??= accelerometerEventStream(
      samplingPeriod: const Duration(milliseconds: 200),
    ).listen(_onEvent);
    notifyListeners();
  }

  void disable() {
    smartModeEnabled = false;
    _sub?.cancel();
    _sub = null;
    notifyListeners();
  }

  void _onEvent(AccelerometerEvent event) {
    final next = event.x.abs() > _landscapeThreshold
        ? PhysicalOrientation.landscape
        : (event.y.abs() > _landscapeThreshold ? PhysicalOrientation.portrait : orientation);
    if (next != orientation) {
      orientation = next;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
