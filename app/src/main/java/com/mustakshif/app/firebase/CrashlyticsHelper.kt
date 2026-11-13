package com.mustakshif.app.firebase

import android.content.Context
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.mustakshif.app.BuildConfig

/**
 * Crashlytics stability helper:
 * - Enabled for release builds only (!BuildConfig.DEBUG).
 * - Safely no-ops if Google Play Services is unavailable on device.
 * - Provides custom keys, breadcrumbs, and non-fatal error reporting for Ads/Consent/TTS.
 */
object CrashlyticsHelper {

    @Volatile
    private var isInitialized = false

    fun init(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) {
            isInitialized = false
            return
        }
        try {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)
            crashlytics.setCustomKey("min_sdk", 21)
            crashlytics.setCustomKey("app_language", "ar")
            isInitialized = true
        } catch (_: Throwable) {
            isInitialized = false
        }
    }

    fun setArticleOpenKey(mythId: String) {
        if (!isInitialized) return
        try {
            FirebaseCrashlytics.getInstance().setCustomKey("myth_id", mythId)
        } catch (_: Throwable) {
        }
    }

    fun setCurrentScreenKey(screenName: String) {
        if (!isInitialized) return
        try {
            FirebaseCrashlytics.getInstance().setCustomKey("screen", screenName)
        } catch (_: Throwable) {
        }
    }

    fun logAdBreadcrumb(message: String) {
        if (!isInitialized) return
        try {
            FirebaseCrashlytics.getInstance().log("[AdBreadcrumb] $message")
        } catch (_: Throwable) {
        }
    }

    fun recordNonFatal(tag: String, throwable: Throwable) {
        if (!isInitialized) return
        try {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.log("[$tag] ${throwable.message ?: "Non-fatal error"}")
            crashlytics.recordException(throwable)
        } catch (_: Throwable) {
        }
    }
}
