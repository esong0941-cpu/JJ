import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../models/paired_device.dart';
import '../../providers/remote_executor.dart';

/// Scans the QR code shown on a receiver device's screen (see
/// ReceiverHomeScreen) — or accepts manual IP/port/PIN entry when a camera
/// or QR isn't convenient — and pairs with it.
class ScanPairScreen extends StatefulWidget {
  const ScanPairScreen({super.key});

  @override
  State<ScanPairScreen> createState() => _ScanPairScreenState();
}

class _ScanPairScreenState extends State<ScanPairScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _handled = false;
  bool _connecting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handlePayload(String raw) async {
    if (_handled) return;
    Map<String, dynamic> data;
    try {
      data = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final host = data['host'] as String?;
    final port = data['port'] as int?;
    final pin = data['pin'] as String?;
    final name = data['name'] as String? ?? 'Android 기기';
    if (host == null || port == null || pin == null) return;

    setState(() => _handled = true);
    await _connect(host, port, pin, name);
  }

  Future<void> _connect(String host, int port, String pin, String name) async {
    setState(() => _connecting = true);
    final device = PairedDevice(
      name: name,
      host: host,
      port: port,
      token: pin,
      lastConnected: DateTime.now(),
    );
    final ok = await context.read<RemoteExecutor>().connectTo(device, pin: pin);
    if (!mounted) return;
    setState(() => _connecting = false);
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      _handled = false;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('페어링에 실패했습니다. PIN 또는 주소를 확인하세요.')),
      );
    }
  }

  void _showManualEntry() {
    final hostCtrl = TextEditingController();
    final portCtrl = TextEditingController(text: '58217');
    final pinCtrl = TextEditingController();
    final nameCtrl = TextEditingController(text: 'Android 기기');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('수동으로 연결'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: '기기 이름')),
            TextField(controller: hostCtrl, decoration: const InputDecoration(labelText: 'IP 주소 (예: 192.168.0.10)')),
            TextField(controller: portCtrl, decoration: const InputDecoration(labelText: '포트'), keyboardType: TextInputType.number),
            TextField(controller: pinCtrl, decoration: const InputDecoration(labelText: 'PIN (6자리)'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('취소')),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              final port = int.tryParse(portCtrl.text) ?? 58217;
              _connect(hostCtrl.text.trim(), port, pinCtrl.text.trim(), nameCtrl.text.trim());
            },
            child: const Text('연결'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR 코드로 페어링'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_note), onPressed: _showManualEntry, tooltip: '수동 입력'),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              for (final barcode in capture.barcodes) {
                final raw = barcode.rawValue;
                if (raw != null) _handlePayload(raw);
              }
            },
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              color: Colors.black54,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_connecting)
                    const CircularProgressIndicator()
                  else
                    const Text(
                      '조작 대상 기기(수신기 모드)에 표시된 QR 코드를 비춰주세요',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white),
                    ),
                  const SizedBox(height: 8),
                  TextButton(onPressed: _showManualEntry, child: const Text('QR 대신 직접 입력하기')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
