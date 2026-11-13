package com.mustakshif.app.firebase

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.FirebaseAnalytics.ConsentStatus
import com.google.firebase.analytics.FirebaseAnalytics.ConsentType

/**
 * Native Firebase Analytics manager (replaces web-only Cloudflare beacon).
 * Respects UMP Consent Mode strictly and skips all logging if Play Services is unavailable or consent is denied.
 */
object AnalyticsManager {

    @Volatile
    private var analytics: FirebaseAnalytics? = null

    @Volatile
    private var isAnalyticsAllowed: Boolean = false

    fun init(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) {
            analytics = null
            isAnalyticsAllowed = false
            return
        }

        try {
            val instance = FirebaseAnalytics.getInstance(context.applicationContext)
            val defaultParams = Bundle().apply {
                putString("app_language", "ar")
                putInt("min_sdk", 21)
            }
            instance.setDefaultEventParameters(defaultParams)
            // Keep disabled until UMP consent resolves
            instance.setAnalyticsCollectionEnabled(false)
            analytics = instance
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("AnalyticsInit", t)
            analytics = null
        }
    }

    /**
     * Maps UMP consent decisions directly to Firebase Analytics Consent Mode.
     */
    fun updateConsent(
        context: Context,
        analyticsStorageGranted: Boolean,
        adStorageGranted: Boolean,
        adUserDataGranted: Boolean,
        adPersonalizationGranted: Boolean
    ) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) {
            isAnalyticsAllowed = false
            return
        }

        try {
            val instance = analytics ?: FirebaseAnalytics.getInstance(context.applicationContext).also {
                analytics = it
            }

            val consentMap = mapOf(
                ConsentType.ANALYTICS_STORAGE to if (analyticsStorageGranted) ConsentStatus.GRANTED else ConsentStatus.DENIED,
                ConsentType.AD_STORAGE to if (adStorageGranted) ConsentStatus.GRANTED else ConsentStatus.DENIED,
                ConsentType.AD_USER_DATA to if (adUserDataGranted) ConsentStatus.GRANTED else ConsentStatus.DENIED,
                ConsentType.AD_PERSONALIZATION to if (adPersonalizationGranted) ConsentStatus.GRANTED else ConsentStatus.DENIED
            )
            instance.setConsent(consentMap)
            instance.setAnalyticsCollectionEnabled(analyticsStorageGranted)
            isAnalyticsAllowed = analyticsStorageGranted
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("AnalyticsConsent", t)
            isAnalyticsAllowed = false
        }
    }

    fun logScreenView(screenName: String) {
        CrashlyticsHelper.setCurrentScreenKey(screenName)
        logCustomEvent("screen_view") {
            putString("screen_name", screenName)
        }
    }

    fun logArticleOpen(mythId: String, category: String) {
        CrashlyticsHelper.setArticleOpenKey(mythId)
        logCustomEvent("article_open") {
            putString("myth_id", mythId)
            putString("category", category)
        }
    }

    fun logArticleReadComplete(mythId: String, readSeconds: Long) {
        logCustomEvent("article_read_complete") {
            putString("myth_id", mythId)
            putLong("read_seconds", readSeconds)
        }
    }

    fun logDeepStoryChapterRead(mythId: String, chapterIndex: Int) {
        logCustomEvent("deep_story_chapter_read") {
            putString("myth_id", mythId)
            putInt("chapter_index", chapterIndex)
        }
    }

    fun logSearchQuery(queryLength: Int, resultsCount: Int) {
        logCustomEvent("search_query") {
            putInt("query_length", queryLength)
            putInt("results_count", resultsCount)
        }
    }

    fun logBookmarkToggle(mythId: String, state: Boolean) {
        logCustomEvent("bookmark_toggle") {
            putString("myth_id", mythId)
            putBoolean("state", state)
        }
    }

    fun logHookCopy(mythId: String, hookType: String) {
        logCustomEvent("hook_copy") {
            putString("myth_id", mythId)
            putString("hook_type", hookType)
        }
    }

    fun logHookExport(count: Int) {
        logCustomEvent("hook_export") {
            putInt("count", count)
        }
    }

    fun logMapPinOpen(mythId: String) {
        logCustomEvent("map_pin_open") {
            putString("myth_id", mythId)
        }
    }

    fun logThemeToggle(mode: String) {
        logCustomEvent("theme_toggle") {
            putString("mode", mode)
        }
    }

    fun logTtsPlay(mythId: String) {
        logCustomEvent("tts_play") {
            putString("myth_id", mythId)
        }
    }

    fun logAdDismissed(type: String) {
        logCustomEvent("ad_dismissed") {
            putString("type", type)
        }
    }

    /**
     * Logs AdMob revenue impression to Firebase Analytics (ad_impression).
     */
    fun logAdImpression(
        adUnitId: String,
        adFormat: String,
        valueMicros: Long,
        currencyCode: String
    ) {
        if (!isAnalyticsAllowed) return
        val instance = analytics ?: return
        try {
            val params = Bundle().apply {
                putString(FirebaseAnalytics.Param.AD_PLATFORM, "admob")
                putString(FirebaseAnalytics.Param.AD_UNIT_NAME, adUnitId)
                putString(FirebaseAnalytics.Param.AD_FORMAT, adFormat)
                putDouble(FirebaseAnalytics.Param.VALUE, valueMicros / 1_000_000.0)
                putString(FirebaseAnalytics.Param.CURRENCY, currencyCode)
            }
            instance.logEvent(FirebaseAnalytics.Event.AD_IMPRESSION, params)
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("AnalyticsAdImpression", t)
        }
    }

    private inline fun logCustomEvent(name: String, block: Bundle.() -> Unit) {
        if (!isAnalyticsAllowed) return
        val instance = analytics ?: return
        try {
            val params = Bundle().apply(block)
            instance.logEvent(name, params)
        } catch (_: Throwable) {
        }
    }
}
