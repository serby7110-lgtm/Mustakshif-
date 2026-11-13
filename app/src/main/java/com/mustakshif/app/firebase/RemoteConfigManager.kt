package com.mustakshif.app.firebase

import android.content.Context
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings
import com.mustakshif.app.BuildConfig
import com.mustakshif.app.R
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class RemoteConfigValues(
    val adsEnabled: Boolean = true,
    val bannerEnabled: Boolean = true,
    val interstitialEnabled: Boolean = true,
    val interstitialCapSeconds: Long = 90L,
    val interstitialEveryNArticles: Int = 2,
    val appOpenEnabled: Boolean = true,
    val ttsEnabled: Boolean = true,
    val pushEnabled: Boolean = false,
    val dailyMythId: String = "anqa",
    val minAppVersionCode: Int = 1
)

/**
 * Remote Config manager tuning ad formats (Banner, Interstitial, App Open), TTS, and optional FCM push.
 * Falls back silently to res/xml/remote_config_defaults.xml on fetch timeout or offline mode.
 */
object RemoteConfigManager {

    private const val FETCH_TIMEOUT_SECONDS = 10L
    private const val PROD_MIN_FETCH_INTERVAL_SECONDS = 3600L

    private val _values = MutableStateFlow(RemoteConfigValues())
    val values: StateFlow<RemoteConfigValues> = _values.asStateFlow()

    val current: RemoteConfigValues
        get() = _values.value

    fun initializeAndFetch(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) {
            _values.value = RemoteConfigValues()
            return
        }

        try {
            val remoteConfig = FirebaseRemoteConfig.getInstance()
            val settings = FirebaseRemoteConfigSettings.Builder()
                .setFetchTimeoutInSeconds(FETCH_TIMEOUT_SECONDS)
                .setMinimumFetchIntervalInSeconds(
                    if (BuildConfig.DEBUG) 0L else PROD_MIN_FETCH_INTERVAL_SECONDS
                )
                .build()

            remoteConfig.setConfigSettingsAsync(settings)
            remoteConfig.setDefaultsAsync(R.xml.remote_config_defaults)

            // Apply cached/default values immediately
            refreshValuesFrom(remoteConfig)

            // Fetch and activate updates asynchronously with silent fallback on failure
            remoteConfig.fetchAndActivate().addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    refreshValuesFrom(remoteConfig)
                } else {
                    task.exception?.let { err ->
                        CrashlyticsHelper.recordNonFatal("RemoteConfigFetch", err)
                    }
                }
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("RemoteConfigInit", t)
            _values.value = RemoteConfigValues()
        }
    }

    private fun refreshValuesFrom(remoteConfig: FirebaseRemoteConfig) {
        try {
            val updated = RemoteConfigValues(
                adsEnabled = remoteConfig.getBoolean("ads_enabled"),
                bannerEnabled = remoteConfig.getBoolean("banner_enabled"),
                interstitialEnabled = remoteConfig.getBoolean("interstitial_enabled"),
                interstitialCapSeconds = remoteConfig.getLong("interstitial_cap_seconds").coerceAtLeast(0L),
                interstitialEveryNArticles = remoteConfig.getLong("interstitial_every_n_articles").toInt().coerceAtLeast(1),
                appOpenEnabled = remoteConfig.getBoolean("app_open_enabled"),
                ttsEnabled = remoteConfig.getBoolean("tts_enabled"),
                pushEnabled = remoteConfig.getBoolean("push_enabled"),
                dailyMythId = remoteConfig.getString("daily_myth_id").ifBlank { "anqa" },
                minAppVersionCode = remoteConfig.getLong("min_app_version_code").toInt().coerceAtLeast(1)
            )
            _values.value = updated
            syncMessagingActivation(updated.pushEnabled)
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("RemoteConfigParse", t)
        }
    }

    private fun syncMessagingActivation(pushEnabled: Boolean) {
        try {
            FirebaseMessaging.getInstance().isAutoInitEnabled = pushEnabled
        } catch (_: Throwable) {
        }
    }
}
