package com.mustakshif.app.ads

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.appopen.AppOpenAd
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.mustakshif.app.MustakshifApplication
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.PlayServicesGuard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Centralized, API-21-safe, crash-proof AdMob coordinator for Mustakshif.
 * Strictly manages THREE formats: Banner (via BannerAdSlot), Interstitial, and App Open.
 * Driven by Remote Config, gated by UMP + PlayServicesGuard, and instrumented with
 * Firebase Analytics (ad_impression / ad_dismissed) & Crashlytics breadcrumbs.
 */
object AdManager {

    private val mainHandler = Handler(Looper.getMainLooper())

    private val _isShowingAppOpenOverlay = MutableStateFlow(false)
    val isShowingAppOpenOverlay: StateFlow<Boolean> = _isShowingAppOpenOverlay.asStateFlow()

    private var interstitialAd: InterstitialAd? = null
    private var isLoadingInterstitial = false
    private var isShowingInterstitial = false
    private var lastInterstitialShownElapsedMs = 0L
    private var completedArticlesCount = 0
    private var lastCompletedArticleId: String? = null

    private var appOpenAd: AppOpenAd? = null
    private var isLoadingAppOpen = false
    private var isShowingAppOpenAd = false
    private var lastAppOpenShownElapsedMs = 0L
    private var appOpenRequestSeq = 0L
    private var appOpenTimeoutRunnable: Runnable? = null

    /**
     * Called only after UMP reports canRequestAds() == true.
     */
    fun onConsentGranted(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) return
        if (!AdConfig.adsEnabled || !ConsentManager.canRequestAds(context)) return
        val appContext = context.applicationContext
        preloadInterstitial(appContext)
        preloadAppOpen(appContext)
    }

    /**
     * Banner is strictly allowed on Home, Library, and Studio ONLY,
     * hidden inside Article reading screen and when consent/RemoteConfig disables it.
     */
    fun canShowBanner(screen: AppScreen, canRequestAds: Boolean): Boolean {
        return AdConfig.bannerEnabled &&
            canRequestAds &&
            screen in AdConfig.BANNER_ALLOWED_SCREENS
    }

    fun preloadInterstitial(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) return
        if (!AdConfig.interstitialEnabled || isLoadingInterstitial || interstitialAd != null) return
        if (!ConsentManager.canRequestAds(context)) return

        try {
            isLoadingInterstitial = true
            InterstitialAd.load(
                context.applicationContext,
                AdConfig.interstitialUnitId,
                AdRequest.Builder().build(),
                object : InterstitialAdLoadCallback() {
                    override fun onAdLoaded(ad: InterstitialAd) {
                        isLoadingInterstitial = false
                        ad.setOnPaidEventListener { adValue ->
                            AnalyticsManager.logAdImpression(
                                adUnitId = AdConfig.interstitialUnitId,
                                adFormat = "interstitial",
                                valueMicros = adValue.valueMicros,
                                currencyCode = adValue.currencyCode
                            )
                        }
                        interstitialAd = ad
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        isLoadingInterstitial = false
                        interstitialAd = null
                        CrashlyticsHelper.logAdBreadcrumb("Interstitial load failed: ${error.code} - ${error.message}")
                    }
                }
            )
        } catch (t: Throwable) {
            isLoadingInterstitial = false
            interstitialAd = null
            CrashlyticsHelper.recordNonFatal("InterstitialLoad", t)
        }
    }

    /**
     * Shows interstitial ONLY after an article reaches 100% reading progress OR every N completed articles.
     * Rules enforced:
     * - Cap 1 per 90s (Remote Config: interstitial_cap_seconds)
     * - Never on first-ever launch, mid-reading (<100%), or back-navigation loops
     * - Never within 60 seconds of an App Open ad impression
     * - Skips cleanly if not preloaded yet, and preloads the next one
     */
    fun onArticleReadingProgress(
        activity: Activity,
        progressPercent: Int,
        isBackNavigation: Boolean = false,
        articleId: String? = null
    ) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) return
        if (!AdConfig.interstitialEnabled) return
        if (isBackNavigation || progressPercent < 100 || isShowingInterstitial || isShowingAppOpenAd) return
        if (!ConsentManager.canRequestAds(activity)) return

        val app = activity.application as? MustakshifApplication
        if (app?.isFirstEverLaunch == true) return

        if (articleId != null && articleId == lastCompletedArticleId) return
        if (articleId != null) {
            lastCompletedArticleId = articleId
        }

        completedArticlesCount += 1
        val step = AdConfig.interstitialArticleStep.coerceAtLeast(1)
        if (completedArticlesCount % step != 0) {
            return
        }

        val now = SystemClock.elapsedRealtime()

        // Enforce 60-second cooldown after an App Open ad
        if (lastAppOpenShownElapsedMs != 0L &&
            (now - lastAppOpenShownElapsedMs) < AdConfig.INTERSTITIAL_AFTER_APP_OPEN_COOLDOWN_MS
        ) {
            return
        }

        // Enforce 90-second cooldown between Interstitial ads
        val elapsedSinceLast = now - lastInterstitialShownElapsedMs
        if (lastInterstitialShownElapsedMs != 0L && elapsedSinceLast < AdConfig.interstitialCooldownMs) {
            return
        }

        val ad = interstitialAd
        if (ad == null) {
            preloadInterstitial(activity.applicationContext)
            return
        }

        try {
            isShowingInterstitial = true
            interstitialAd = null
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    isShowingInterstitial = false
                    lastInterstitialShownElapsedMs = SystemClock.elapsedRealtime()
                    AnalyticsManager.logAdDismissed("interstitial")
                    preloadInterstitial(activity.applicationContext)
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    isShowingInterstitial = false
                    CrashlyticsHelper.logAdBreadcrumb("Interstitial show failed: ${error.code} - ${error.message}")
                    preloadInterstitial(activity.applicationContext)
                }
            }
            lastInterstitialShownElapsedMs = now
            ad.show(activity)
        } catch (t: Throwable) {
            isShowingInterstitial = false
            interstitialAd = null
            CrashlyticsHelper.recordNonFatal("InterstitialShow", t)
        }
    }

    fun preloadAppOpen(context: Context) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) return
        if (!AdConfig.appOpenEnabled || isLoadingAppOpen || appOpenAd != null) return
        if (!ConsentManager.canRequestAds(context)) return

        try {
            isLoadingAppOpen = true
            AppOpenAd.load(
                context.applicationContext,
                AdConfig.appOpenUnitId,
                AdRequest.Builder().build(),
                object : AppOpenAd.AppOpenAdLoadCallback() {
                    override fun onAdLoaded(ad: AppOpenAd) {
                        isLoadingAppOpen = false
                        ad.setOnPaidEventListener { adValue ->
                            AnalyticsManager.logAdImpression(
                                adUnitId = AdConfig.appOpenUnitId,
                                adFormat = "app_open",
                                valueMicros = adValue.valueMicros,
                                currencyCode = adValue.currencyCode
                            )
                        }
                        appOpenAd = ad
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        isLoadingAppOpen = false
                        appOpenAd = null
                        CrashlyticsHelper.logAdBreadcrumb("AppOpen preload failed: ${error.code} - ${error.message}")
                    }
                }
            )
        } catch (t: Throwable) {
            isLoadingAppOpen = false
            appOpenAd = null
            CrashlyticsHelper.recordNonFatal("AppOpenPreload", t)
        }
    }

    /**
     * App Open Ad entry point via ProcessLifecycleOwner & cold-start consent completion.
     * Rules enforced:
     * - Fires ONLY on cold start after first-ever launch OR return from background > 30 seconds
     * - Never fires on first-ever launch or every regular activity resume
     * - Shows branded loading screen with logo while preparing, guarded by a strict 5-second timeout
     * - Skips cleanly if UMP consent is not ready or Play Services is unavailable
     */
    fun onAppForegrounded(
        activity: Activity,
        isColdStart: Boolean,
        backgroundDurationMs: Long = 0L
    ) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) return
        if (!AdConfig.appOpenEnabled) return
        if (activity.isFinishing || activity.isDestroyed) return
        if (isShowingAppOpenAd || isShowingInterstitial) return

        val app = activity.application as? MustakshifApplication ?: return
        if (app.isFirstEverLaunch) return

        if (isColdStart) {
            if (app.hasAttemptedColdStartAppOpen) return
            app.hasAttemptedColdStartAppOpen = true
        } else {
            if (backgroundDurationMs <= AdConfig.APP_OPEN_BACKGROUND_THRESHOLD_MS) return
        }

        if (!ConsentManager.canRequestAds(activity)) return

        val cachedAd = appOpenAd
        if (cachedAd != null) {
            appOpenAd = null
            showAppOpenAd(activity, cachedAd)
            return
        }

        val requestId = ++appOpenRequestSeq
        _isShowingAppOpenOverlay.value = true

        val timeoutRunnable = Runnable {
            if (appOpenRequestSeq == requestId) {
                appOpenRequestSeq++
                isLoadingAppOpen = false
                _isShowingAppOpenOverlay.value = false
                CrashlyticsHelper.logAdBreadcrumb("AppOpen timed out after ${AdConfig.APP_OPEN_TIMEOUT_MS}ms")
            }
        }
        cancelPendingAppOpenTimeout()
        appOpenTimeoutRunnable = timeoutRunnable
        mainHandler.postDelayed(timeoutRunnable, AdConfig.APP_OPEN_TIMEOUT_MS)

        try {
            isLoadingAppOpen = true
            AppOpenAd.load(
                activity.applicationContext,
                AdConfig.appOpenUnitId,
                AdRequest.Builder().build(),
                object : AppOpenAd.AppOpenAdLoadCallback() {
                    override fun onAdLoaded(ad: AppOpenAd) {
                        isLoadingAppOpen = false
                        ad.setOnPaidEventListener { adValue ->
                            AnalyticsManager.logAdImpression(
                                adUnitId = AdConfig.appOpenUnitId,
                                adFormat = "app_open",
                                valueMicros = adValue.valueMicros,
                                currencyCode = adValue.currencyCode
                            )
                        }

                        if (appOpenRequestSeq != requestId) {
                            // Timed out or cancelled; cache ad for future >30s return instead of startling user
                            appOpenAd = ad
                            return
                        }

                        cancelPendingAppOpenTimeout()
                        _isShowingAppOpenOverlay.value = false
                        showAppOpenAd(activity, ad)
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        isLoadingAppOpen = false
                        if (appOpenRequestSeq == requestId) {
                            cancelPendingAppOpenTimeout()
                            _isShowingAppOpenOverlay.value = false
                        }
                        CrashlyticsHelper.logAdBreadcrumb("AppOpen load failed: ${error.code} - ${error.message}")
                    }
                }
            )
        } catch (t: Throwable) {
            isLoadingAppOpen = false
            cancelPendingAppOpenTimeout()
            _isShowingAppOpenOverlay.value = false
            CrashlyticsHelper.recordNonFatal("AppOpenLoad", t)
        }
    }

    private fun showAppOpenAd(activity: Activity, ad: AppOpenAd) {
        if (!AdConfig.appOpenEnabled ||
            activity.isFinishing ||
            activity.isDestroyed ||
            !ConsentManager.canRequestAds(activity)
        ) {
            _isShowingAppOpenOverlay.value = false
            return
        }

        try {
            isShowingAppOpenAd = true
            val shownAt = SystemClock.elapsedRealtime()
            lastAppOpenShownElapsedMs = shownAt

            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdShowedFullScreenContent() {
                    lastAppOpenShownElapsedMs = SystemClock.elapsedRealtime()
                    _isShowingAppOpenOverlay.value = false
                }

                override fun onAdDismissedFullScreenContent() {
                    isShowingAppOpenAd = false
                    lastAppOpenShownElapsedMs = SystemClock.elapsedRealtime()
                    _isShowingAppOpenOverlay.value = false
                    AnalyticsManager.logAdDismissed("app_open")
                    preloadAppOpen(activity.applicationContext)
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    isShowingAppOpenAd = false
                    _isShowingAppOpenOverlay.value = false
                    CrashlyticsHelper.logAdBreadcrumb("AppOpen show failed: ${error.code} - ${error.message}")
                    preloadAppOpen(activity.applicationContext)
                }
            }
            ad.show(activity)
        } catch (t: Throwable) {
            isShowingAppOpenAd = false
            _isShowingAppOpenOverlay.value = false
            CrashlyticsHelper.recordNonFatal("AppOpenShow", t)
        }
    }

    private fun cancelPendingAppOpenTimeout() {
        appOpenTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        appOpenTimeoutRunnable = null
    }

    fun clearAppOpenAd() {
        appOpenRequestSeq++
        cancelPendingAppOpenTimeout()
        _isShowingAppOpenOverlay.value = false
        appOpenAd = null
        isLoadingAppOpen = false
    }

    fun clearInterstitialAd() {
        interstitialAd = null
        isLoadingInterstitial = false
    }

    fun clearLoadedAds() {
        clearAppOpenAd()
        clearInterstitialAd()
    }
}
