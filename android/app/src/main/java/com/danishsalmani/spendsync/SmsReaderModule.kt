package com.danishsalmani.spendsync

import android.net.Uri
import com.facebook.react.bridge.*

class SmsReaderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsReader"

    @ReactMethod
    fun getSMS(startTimestamp: Double, promise: Promise) {
        try {
            val smsList = Arguments.createArray()
            val uri = Uri.parse("content://sms/inbox")

            val cursor = reactApplicationContext.contentResolver.query(
                uri,
                arrayOf("body", "date"),
                "date >= ?",
                arrayOf(startTimestamp.toLong().toString()),
                "date DESC"
            )

            cursor?.use {
                val bodyIndex = it.getColumnIndex("body")
                val dateIndex = it.getColumnIndex("date")

                while (it.moveToNext()) {
                    val sms = Arguments.createMap()
                    sms.putString("body", it.getString(bodyIndex))
                    sms.putDouble("date", it.getString(dateIndex).toDouble())
                    smsList.pushMap(sms)
                }
            }

            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun hasNotificationPermission(promise: Promise) {
        try {
            val enabledListeners = androidx.core.app.NotificationManagerCompat.getEnabledListenerPackages(reactApplicationContext)
            promise.resolve(enabledListeners.contains(reactApplicationContext.packageName))
        } catch (e: Exception) {
            // Fallback for older versions or if NotificationManagerCompat fails
            val packageName = reactApplicationContext.packageName
            val listeners = android.provider.Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            )
            promise.resolve(listeners?.contains(packageName) == true)
        }
    }
}