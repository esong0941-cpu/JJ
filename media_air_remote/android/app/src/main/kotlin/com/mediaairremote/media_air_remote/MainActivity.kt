package com.mediaairremote.media_air_remote

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import android.view.KeyEvent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.net.NetworkInterface
import java.util.Collections

class MainActivity : FlutterActivity() {
    private val channelName = "media_air_remote/native"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
            when (call.method) {
                "isAccessibilityServiceEnabled" -> result.success(isAccessibilityServiceEnabled())
                "openAccessibilitySettings" -> {
                    startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    result.success(null)
                }
                "installedPackages" -> {
                    @Suppress("UNCHECKED_CAST")
                    val candidates = call.argument<List<String>>("candidates") ?: emptyList()
                    result.success(installedPackages(candidates))
                }
                "launchApp" -> {
                    val pkg = call.argument<String>("packageName")
                    result.success(if (pkg != null) launchApp(pkg) else false)
                }
                "executeCommand" -> {
                    val action = call.argument<String>("action") ?: ""
                    val payload = call.argument<String>("payload")
                    result.success(executeCommand(action, payload))
                }
                "localIpAddress" -> result.success(localIpAddress())
                "deviceName" -> result.success(deviceName())
                "startReceiverForegroundService" -> {
                    ReceiverForegroundService.start(this)
                    result.success(null)
                }
                "stopReceiverForegroundService" -> {
                    ReceiverForegroundService.stop(this)
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expected = "$packageName/${RemoteAccessibilityService::class.java.name}"
        val enabled = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabled)
        for (component in splitter) {
            if (component.equals(expected, ignoreCase = true)) return true
        }
        return false
    }

    private fun installedPackages(candidates: List<String>): List<String> {
        val pm = packageManager
        return candidates.filter { pkg ->
            try {
                pm.getPackageInfo(pkg, 0)
                true
            } catch (e: PackageManager.NameNotFoundException) {
                false
            }
        }
    }

    private fun launchApp(packageName: String): Boolean {
        val pm = packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)
        return try {
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(launchIntent)
                true
            } else {
                val marketIntent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("market://details?id=$packageName")
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(marketIntent)
                false
            }
        } catch (e: ActivityNotFoundException) {
            try {
                val webIntent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(webIntent)
            } catch (ignored: ActivityNotFoundException) {
                // No browser/Play Store available either; nothing more we can do.
            }
            false
        }
    }

    private fun executeCommand(action: String, payload: String?): Boolean {
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        return when (action) {
            "volumeUp" -> {
                audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                true
            }
            "volumeDown" -> {
                audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
                true
            }
            "mute" -> {
                audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.FLAG_SHOW_UI)
                true
            }
            "mediaPlayPause" -> dispatchMediaKey(audioManager, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
            "mediaNext" -> dispatchMediaKey(audioManager, KeyEvent.KEYCODE_MEDIA_NEXT)
            "mediaPrevious" -> dispatchMediaKey(audioManager, KeyEvent.KEYCODE_MEDIA_PREVIOUS)
            // Standardized 10s skip isn't exposed via key events; fast-forward/
            // rewind is the closest generic media-button mapping.
            "seekForward10" -> dispatchMediaKey(audioManager, KeyEvent.KEYCODE_MEDIA_FAST_FORWARD)
            "seekBackward10" -> dispatchMediaKey(audioManager, KeyEvent.KEYCODE_MEDIA_REWIND)
            "launchApp" -> if (payload != null) launchApp(payload) else false
            "enterChannelNumber" -> {
                if (payload != null) RemoteAccessibilityService.instance?.enterChannelNumber(payload) ?: false else false
            }
            "dpadUp", "dpadDown", "dpadLeft", "dpadRight", "dpadCenter",
            "back", "home", "recents", "lockScreen", "channelUp", "channelDown" -> {
                RemoteAccessibilityService.instance?.dpad(action) ?: false
            }
            else -> false
        }
    }

    private fun dispatchMediaKey(audioManager: AudioManager?, keyCode: Int): Boolean {
        if (audioManager == null) return false
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
        return true
    }

    private fun localIpAddress(): String? {
        try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                val addrs = Collections.list(intf.inetAddresses)
                for (addr in addrs) {
                    if (!addr.isLoopbackAddress && addr.hostAddress?.contains(':') == false) {
                        return addr.hostAddress
                    }
                }
            }
        } catch (ignored: Exception) {
        }
        return null
    }

    private fun deviceName(): String {
        val fromSettings = try {
            Settings.Global.getString(contentResolver, "device_name")
        } catch (e: Exception) {
            null
        }
        return fromSettings ?: "${Build.MANUFACTURER} ${Build.MODEL}"
    }
}
