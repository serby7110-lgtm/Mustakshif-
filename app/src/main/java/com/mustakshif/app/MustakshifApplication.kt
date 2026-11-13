package com.mustakshif.app

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Bundle
import android.os.SystemClock
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.mustakshif.app.ads.AdConfig
import com.mustakshif.app.ads.AdManager
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.PlayServicesGuard
import com.mustakshif.app.firebase.RemoteConfigManager
import java.lang.ref.WeakReference

/**
 * Application entry point for Mustakshif.
 * - Guards Firebase and MobileAds initialization behind GoogleApiAvailability (API 21+ safe).
 * - Configures Google Mobile Ads for a GENERAL-AUDIENCE encyclopedia (MaxAdContentRating.T)
 *   with all child-directed / Families flags explicitly set to FALSE.
 * - Uses ProcessLifecycleOwner to trigger App Open ads ONLY on cold start after first launch
 *   or when returning to foreground after > 30 seconds in background.
 */
class MustakshifApplication : Application(), DefaultLifecycleObserver, Application.ActivityLifecycleCallbacks {

    var isFirstEverLaunch: Boolean = false
        private set

    var hasAttemptedColdStartAppOpen: Boolean = false

    private var currentActivityRef: WeakReference<Activity>? = null
    private var backgroundedAtElapsedMs: Long = 0L

    override fun onCreate() {
        super<Application>.onCreate()
        recordColdStartLaunch()

        registerActivityLifecycleCallbacks(this)
        ProcessLifecycleOwner.get().lifecycle.addObserver(this)

        // Critical API 21 safety check: skip Firebase & Ads if Play Services is unavailable
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(this)) {
            return
        }

        CrashlyticsHelper.init(this)
        AnalyticsManager.init(this)
        RemoteConfigManager.initializeAndFetch(this)
        initializeMobileAdsSafely()
    }

    override fun onStart(owner: LifecycleOwner) {
        val backgroundedAt = backgroundedAtElapsedMs
        if (backgroundedAt <= 0L) {
            // Initial cold start is triggered explicitly once UMP consent resolves in MainActivity
            return
        }
        val backgroundDurationMs = SystemClock.elapsedRealtime() - backgroundedAt
        backgroundedAtElapsedMs = 0L

        if (backgroundDurationMs > AdConfig.APP_OPEN_BACKGROUND_THRESHOLD_MS) {
            val activity = currentActivityRef?.get() ?: return
            AdManager.onAppForegrounded(
                activity = activity,
                isColdStart = false,
                backgroundDurationMs = backgroundDurationMs
            )
        }
    }

    override fun onStop(owner: LifecycleOwner) {
        backgroundedAtElapsedMs = SystemClock.elapsedRealtime()
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        currentActivityRef = WeakReference(activity)
    }

    override fun onActivityStarted(activity: Activity) {
        currentActivityRef = WeakReference(activity)
    }

    override fun onActivityResumed(activity: Activity) {
        currentActivityRef = WeakReference(activity)
    }

    override fun onActivityPaused(activity: Activity) {}

    override fun onActivityStopped(activity: Activity) {}

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

    override fun onActivityDestroyed(activity: Activity) {
        if (currentActivityRef?.get() == activity) {
            currentActivityRef = null
        }
    }

    private fun recordColdStartLaunch() {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val previousCount = prefs.getLong(KEY_LAUNCH_COUNT, 0L)
            val newCount = previousCount + 1L
            isFirstEverLaunch = (newCount == 1L)
            prefs.edit().putLong(KEY_LAUNCH_COUNT, newCount).apply()
        } catch (_: Exception) {
            isFirstEverLaunch = true
        }
    }

    private fun initializeMobileAdsSafely() {
        try {
            val configBuilder = RequestConfiguration.Builder()
                // General-audience encyclopedia with mild horror themes (MaxAdContentRating.T, NOT G)
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
                // Explicitly NOT child-directed and NOT under age of consent (no Google Play Families flags)
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)

            if (BuildConfig.DEBUG) {
                configBuilder.setTestDeviceIds(listOf(AdRequest.DEVICE_ID_EMULATOR))
            }

            MobileAds.setRequestConfiguration(configBuilder.build())
            MobileAds.initialize(this) { }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("MobileAdsInit", t)
        }
    }

    companion object {
        private const val PREFS_NAME = "mustakshif_app_prefs"
        private const val KEY_LAUNCH_COUNT = "cold_start_launch_count"
    }
}
