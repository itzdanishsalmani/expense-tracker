package com.danishsalmani.spendsync

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication

class NotificationListener : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        val extras: Bundle = sbn.notification.extras
        val title = extras.getString("android.title", "")
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""
        val body = if (bigText.isNotBlank()) bigText else text

        Log.d(
            "NotificationListener",
            "Notification posted package=$packageName title=$title text=$text bigText=$bigText"
        )
        sendEventToReactNative(title, body, packageName, sbn.postTime)
    }

    private fun sendEventToReactNative(title: String, text: String, packageName: String, postTime: Long) {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            val reactInstanceManager = (application as ReactApplication).reactNativeHost.reactInstanceManager
            val reactContext = reactInstanceManager.currentReactContext

            if (reactContext != null) {
                emitEvent(reactContext, title, text, packageName, postTime)
            } else {
                Log.d("NotificationListener", "React context null, attempting to create in background")
                reactInstanceManager.addReactInstanceEventListener(object : com.facebook.react.ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: com.facebook.react.bridge.ReactContext) {
                        emitEvent(context, title, text, packageName, postTime)
                        reactInstanceManager.removeReactInstanceEventListener(this)
                    }
                })
                if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
                    reactInstanceManager.createReactContextInBackground()
                }
            }
        }
    }

    private fun emitEvent(reactContext: com.facebook.react.bridge.ReactContext, title: String, text: String, packageName: String, postTime: Long) {
        val params = Arguments.createMap().apply {
            putString("title", title)
            putString("text", text)
            putString("packageName", packageName)
            putDouble("postTime", postTime.toDouble())
        }
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("PaymentNotification", params)
            Log.d("NotificationListener", "Event emitted successfully")
        } catch (e: Exception) {
            Log.e("NotificationListener", "Error emitting event", e)
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d("NotificationListener", "Notification listener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d("NotificationListener", "Notification listener disconnected")
    }
}
