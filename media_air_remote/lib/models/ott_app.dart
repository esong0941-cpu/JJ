/// Static catalog of the OTT / TV apps MAR knows how to launch.
/// packageName is the real Android application ID used to launch the app
/// (or fall back to its Play Store listing when not installed).
class OttApp {
  final String id;
  final String label;
  final String emoji;
  final String packageName;

  const OttApp({
    required this.id,
    required this.label,
    required this.emoji,
    required this.packageName,
  });

  static const List<OttApp> catalog = [
    OttApp(id: 'btv', label: 'B tv air', emoji: '📺', packageName: 'com.skb.btvmobile'),
    OttApp(id: 'netflix', label: 'Netflix', emoji: '🎬', packageName: 'com.netflix.mediaclient'),
    OttApp(id: 'tving', label: 'TVING', emoji: '🍿', packageName: 'im.tving.player'),
    OttApp(id: 'wavve', label: 'Wavve', emoji: '🌊', packageName: 'kr.co.wavve.pooq'),
    OttApp(id: 'disney', label: 'Disney+', emoji: '⭐', packageName: 'com.disney.disneyplus'),
    OttApp(id: 'coupangplay', label: 'Coupang Play', emoji: '⚽', packageName: 'com.coupang.mobile.play'),
  ];

  static OttApp? byId(String id) {
    for (final app in catalog) {
      if (app.id == id) return app;
    }
    return null;
  }
}
