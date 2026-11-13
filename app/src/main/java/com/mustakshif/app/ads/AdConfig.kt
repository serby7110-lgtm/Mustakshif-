package com.mustakshif.app.ads

import com.mustakshif.app.BuildConfig
import com.mustakshif.app.firebase.RemoteConfigManager

/**
 * Navigation screens in Mustakshif used to enforce calm, non-intrusive ad placement rules.
 */
enum class AppScreen {
    HOME,
    ARTICLE,
    MAP,
    LIBRARY,
    STUDIO,
    PROFILE
}

/**
 * Central AdMob & Remote Config Placement Configuration.
 * Supports strictly THREE ad formats: Banner, Interstitial, and App Open.
 * Debug builds resolve official Google test IDs; Release builds resolve real IDs via BuildConfig.
 * Feature toggles & intervals are dynamically read from Firebase Remote Config.
 */
object AdConfig {
    const val APP_OPEN_BACKGROUND_THRESHOLD_MS = 30_000L
    const val APP_OPEN_TIMEOUT_MS = 5_000L
    const val INTERSTITIAL_AFTER_APP_OPEN_COOLDOWN_MS = 60_000L

    val appId: String
        get() = BuildConfig.ADMOB_APP_ID

    val bannerUnitId: String
        get() = BuildConfig.ADMOB_BANNER_ID

    val interstitialUnitId: String
        get() = BuildConfig.ADMOB_INTERSTITIAL_ID

    val appOpenUnitId: String
        get() = BuildConfig.ADMOB_APP_OPEN_ID

    val adsEnabled: Boolean
        get() = RemoteConfigManager.current.adsEnabled

    val bannerEnabled: Boolean
        get() = adsEnabled && RemoteConfigManager.current.bannerEnabled

    val interstitialEnabled: Boolean
        get() = adsEnabled && RemoteConfigManager.current.interstitialEnabled

    val appOpenEnabled: Boolean
        get() = adsEnabled && RemoteConfigManager.current.appOpenEnabled

    /** Minimum time between interstitial impressions in milliseconds (Remote Config: interstitial_cap_seconds) */
    val interstitialCooldownMs: Long
        get() = RemoteConfigManager.current.interstitialCapSeconds * 1_000L

    /** Show interstitial when an article reaches 100% OR every N completed articles */
    val interstitialArticleStep: Int
        get() = RemoteConfigManager.current.interstitialEveryNArticles

    /** Screens permitted to show the anchored bottom banner above navigation */
    val BANNER_ALLOWED_SCREENS = setOf(
        AppScreen.HOME,
        AppScreen.LIBRARY,
        AppScreen.STUDIO
    )
}
