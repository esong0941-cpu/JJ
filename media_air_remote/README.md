# Media Air Remote (MAR)

모든 OTT를 한 손짓으로 제어하는 스마트 리모컨 — Flutter/Kotlin Android 앱.

## 핵심: 다른 안드로이드 기기 조작

이 앱은 **같은 앱을 두 가지 모드로** 실행합니다.

- **리모컨 모드** — 사용자의 휴대폰에 설치. 터치/제스처/음성으로 명령을 만듭니다.
- **수신기 모드** — TV박스 등 조작 대상 기기에 설치. 같은 와이파이의 리모컨 기기로부터
  명령을 받아 이 기기에서 직접 실행합니다.

리모컨 기기는 수신기 기기 화면에 뜨는 **QR 코드(또는 6자리 PIN)** 를 스캔해 로컬
WebSocket으로 페어링합니다(`lib/network/receiver_server.dart`,
`lib/network/controller_client.dart`). 페어링된 수신기가 없으면 리모컨 모드는 이
기기 자체를 직접 제어합니다 — 즉 두 기기를 준비하지 않아도 단일 기기용 리모컨으로도
동작합니다.

## 실제로 되는 것 / 한계 (설계 문서의 자체 진단을 코드 수준에서 재확인)

| 기능 | 구현 방식 | 신뢰도 |
|---|---|---|
| 앱 실행 (Netflix/TVING/…) | `PackageManager` launch intent, 미설치 시 스토어 이동 | 높음 |
| 볼륨 +/-/음소거 | `AudioManager.adjustStreamVolume` | 높음 |
| 재생/정지/다음/이전 | `AudioManager.dispatchMediaKeyEvent` (미디어 세션 표준 키) | 높음 (미디어 세션을 구현한 앱 대부분에서 동작) |
| 홈/뒤로/최근 | 접근성 서비스 `GLOBAL_ACTION_*` | 높음 |
| 방향키(D-pad) | 접근성 서비스 `GLOBAL_ACTION_DPAD_*` (Android 13+) | Android 13 미만 기기에서는 미동작 |
| 채널 +/- | 방향키(위/아래)로 매핑 | 베스트 에펏 — 앱마다 다르게 반응할 수 있음 |
| 채널 번호 직접 입력 | 화면의 숫자 키패드를 텍스트로 찾아 탭 | 베스트 에펏 — 숫자 키패드가 없는 화면에서는 무동작 |
| 앞으로/뒤로 10초 | `KEYCODE_MEDIA_FAST_FORWARD`/`REWIND` | 표준 10초 스킵이 아닌 앱별 해석에 의존 |
| 음성 명령 | `speech_to_text` + 키워드 매칭 | 높음 (인식 자체는 기기 STT 엔진 성능에 의존) |
| 제스처 인식 | 카메라 프레임에서 YCbCr 피부색 분할 + 방사형 윤곽 피크 카운팅 (`lib/util/hand_gesture_analyzer.dart`) | **참고**: Google ML Kit엔 손동작 인식 API가 없어 학습된 신경망이 아닌 고전적 영상처리 휴리스틱을 사용. 단순 배경·밝은 조명에서 가장 잘 동작 |
| 스마트 모드(방향 감지) | 가속도계 실시간 감지(화면 회전 잠금과 무관) | 높음 |

## 프로젝트 구조

```
lib/
  models/        커맨드 프로토콜, OTT 앱 카탈로그, 페어링 기기 모델
  db/            sqflite 기반 즐겨찾기/최근앱/페어링기기 저장
  native/        MethodChannel 브리지 (Dart ↔ Kotlin)
  network/       리시버 WebSocket 서버 / 컨트롤러 WebSocket 클라이언트
  providers/     상태관리 (Provider 패키지)
  util/          손동작 인식 알고리즘 (순수 Dart, 유닛 테스트 있음)
  screens/       홈/리모컨/설거지모드/제스처모드/음성모드/페어링/설정 화면
android/app/src/main/kotlin/.../
  MainActivity.kt                 MethodChannel 핸들러
  RemoteAccessibilityService.kt   글로벌 액션 + 숫자 키패드 탭
  ReceiverForegroundService.kt    수신기 모드 포그라운드 서비스
```

## 로컬에서 APK 빌드하기

이 저장소를 만든 샌드박스 환경은 아웃바운드 네트워크 정책상 `dl.google.com`
(Android SDK/AndroidX 저장소)에 접근할 수 없어 이 세션에서는 APK를 직접
빌드하지 못했습니다. 코드는 `flutter analyze`/`flutter test`로 전부
검증했습니다. 아래 중 하나로 빌드하세요.

### 옵션 A — 로컬 PC/Android Studio
```
flutter pub get
flutter build apk --release
# 결과물: build/app/outputs/flutter-apk/app-release.apk
```

### 옵션 B — GitHub Actions (자동)
`.github/workflows/build-media-air-remote-apk.yml` 워크플로가 이 브랜치에
push될 때마다 APK를 빌드해 Actions 아티팩트로 올려줍니다. 저장소의
Actions 탭 → 워크플로 실행 → `media-air-remote-apk` 아티팩트를 내려받으면
됩니다.

## 사용 순서

1. 조작 대상 기기(TV박스 등)에도 같은 APK를 설치하고 **수신기 모드** 선택,
   접근성 서비스를 켭니다.
2. 휴대폰에 APK를 설치하고 **리모컨 모드** 선택, "기기 추가"에서 수신기 화면의
   QR 코드를 스캔합니다.
3. 홈 화면에서 OTT 앱 실행, 리모컨/설거지모드/제스처모드/음성모드를 사용합니다.
4. 조작 대상 기기가 따로 없다면 그냥 리모컨 모드만 켜서 휴대폰 자체(접근성 서비스
   켠 상태)를 리모컨으로 쓸 수도 있습니다.
