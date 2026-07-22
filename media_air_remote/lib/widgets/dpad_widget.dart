import 'package:flutter/material.dart';

/// The circular D-pad: up/down/left/right around a center OK button,
/// matching the ▲ / ◀ ▶ / ▼ / 확인(OK) layout from the spec's remote screen.
class DpadWidget extends StatelessWidget {
  final VoidCallback onUp;
  final VoidCallback onDown;
  final VoidCallback onLeft;
  final VoidCallback onRight;
  final VoidCallback onCenter;
  final double size;

  const DpadWidget({
    super.key,
    required this.onUp,
    required this.onDown,
    required this.onLeft,
    required this.onRight,
    required this.onCenter,
    this.size = 220,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.06),
            ),
          ),
          Positioned(top: 0, child: _DirButton(icon: Icons.keyboard_arrow_up, onTap: onUp)),
          Positioned(bottom: 0, child: _DirButton(icon: Icons.keyboard_arrow_down, onTap: onDown)),
          Positioned(left: 0, child: _DirButton(icon: Icons.keyboard_arrow_left, onTap: onLeft)),
          Positioned(right: 0, child: _DirButton(icon: Icons.keyboard_arrow_right, onTap: onRight)),
          _CenterButton(onTap: onCenter, size: size * 0.4),
        ],
      ),
    );
  }
}

class _DirButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _DirButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(width: 64, height: 64, child: Icon(icon, size: 32)),
      ),
    );
  }
}

class _CenterButton extends StatelessWidget {
  final VoidCallback onTap;
  final double size;

  const _CenterButton({required this.onTap, required this.size});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.primary,
      shape: const CircleBorder(),
      elevation: 3,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: size,
          height: size,
          child: const Center(
            child: Text('확인', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }
}
