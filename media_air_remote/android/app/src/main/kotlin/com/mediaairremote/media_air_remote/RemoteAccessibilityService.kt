package com.mediaairremote.media_air_remote

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Provides the only two things a third-party app is actually allowed to do
 * to another app's UI without root: a fixed set of "global actions"
 * (back/home/recents/dpad/lock-screen) and, best-effort, tapping on-screen
 * nodes it can find by their visible text (used for numeric channel entry
 * keypads). This mirrors exactly the limitation called out in the original
 * design doc: full menu/content navigation inside a specific OTT app is not
 * guaranteed to work identically everywhere.
 */
class RemoteAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "RemoteAccessibilityService connected")
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No content is read or stored; we only need window-state events to
        // keep canRetrieveWindowContent usable for enterChannelNumber().
    }

    override fun onInterrupt() {}

    /** DPAD_* global actions require API 33 (Tiramisu); older devices no-op. */
    private fun dpadGlobalAction(action: Int): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            performGlobalAction(action)
        } else {
            false
        }

    fun dpad(action: String): Boolean = when (action) {
        "dpadUp", "channelUp" -> dpadGlobalAction(GLOBAL_ACTION_DPAD_UP)
        "dpadDown", "channelDown" -> dpadGlobalAction(GLOBAL_ACTION_DPAD_DOWN)
        "dpadLeft" -> dpadGlobalAction(GLOBAL_ACTION_DPAD_LEFT)
        "dpadRight" -> dpadGlobalAction(GLOBAL_ACTION_DPAD_RIGHT)
        "dpadCenter" -> dpadGlobalAction(GLOBAL_ACTION_DPAD_CENTER)
        "back" -> performGlobalAction(GLOBAL_ACTION_BACK)
        "home" -> performGlobalAction(GLOBAL_ACTION_HOME)
        "recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
        "lockScreen" ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
            } else {
                false
            }
        else -> false
    }

    /**
     * Best-effort numeric entry: repeatedly re-reads the active window and
     * taps whichever visible node's text/description equals the next digit.
     * Works only against apps that render a tappable numeric keypad.
     */
    fun enterChannelNumber(digits: String): Boolean {
        var tappedAny = false
        for (digit in digits) {
            val root = rootInActiveWindow ?: break
            val node = findNodeByText(root, digit.toString())
            if (node != null) {
                val clickable = findClickableSelfOrAncestor(node)
                if (clickable != null && clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    tappedAny = true
                }
            }
            Thread.sleep(180)
        }
        return tappedAny
    }

    private fun findNodeByText(root: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            if (node.text?.toString() == text || node.contentDescription?.toString() == text) {
                return node
            }
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { queue.add(it) }
            }
        }
        return null
    }

    private fun findClickableSelfOrAncestor(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node
        var hops = 0
        while (current != null && hops < 6) {
            if (current.isClickable) return current
            current = current.parent
            hops++
        }
        return null
    }

    companion object {
        private const val TAG = "MAR-Accessibility"
        var instance: RemoteAccessibilityService? = null
            private set

        val isRunning: Boolean get() = instance != null
    }
}
