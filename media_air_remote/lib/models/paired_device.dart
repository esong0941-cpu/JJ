class PairedDevice {
  final int? id;
  final String name;
  final String host;
  final int port;
  final String token;
  final DateTime lastConnected;

  const PairedDevice({
    this.id,
    required this.name,
    required this.host,
    required this.port,
    required this.token,
    required this.lastConnected,
  });

  Map<String, dynamic> toMap() => {
        if (id != null) 'id': id,
        'name': name,
        'host': host,
        'port': port,
        'token': token,
        'lastConnected': lastConnected.toIso8601String(),
      };

  static PairedDevice fromMap(Map<String, dynamic> map) => PairedDevice(
        id: map['id'] as int?,
        name: map['name'] as String,
        host: map['host'] as String,
        port: map['port'] as int,
        token: map['token'] as String,
        lastConnected: DateTime.parse(map['lastConnected'] as String),
      );

  PairedDevice copyWith({DateTime? lastConnected}) => PairedDevice(
        id: id,
        name: name,
        host: host,
        port: port,
        token: token,
        lastConnected: lastConnected ?? this.lastConnected,
      );
}
