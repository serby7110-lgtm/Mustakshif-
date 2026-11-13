package com.mustakshif.app.ads

import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.LoadAdError
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.RemoteConfigManager
import com.mustakshif.app.theme.DarkBackground
import com.mustakshif.app.theme.LightBackground

/**
 * Anchored Adaptive Banner Ad Slot.
 * - Allowed ONLY on Home, Library, and Studio; hidden inside Article reading screen.
 * - Placed strictly ABOVE bottom navigation with calm spacing so accidental clicks are avoided.
 * - Reserves fixed anchored adaptive height while loading (zero layout shift).
 * - Collapses cleanly to 0 height on load failure, consent denial, or Remote Config disable.
 * - Uses API-21-safe Configuration.screenWidthDp calculation.
 */
@Composable
fun BannerAdSlot(
    screen: AppScreen,
    modifier: Modifier = Modifier
) {
    val canRequestAds by ConsentManager.canRequestAdsState.collectAsState()
    val remoteConfig by RemoteConfigManager.values.collectAsState()

    if (!remoteConfig.adsEnabled || !remoteConfig.bannerEnabled || !AdManager.canShowBanner(screen, canRequestAds)) {
        return
    }

    val context = LocalContext.current
    val density = LocalDensity.current
    val screenWidthDp = LocalConfiguration.current.screenWidthDp.coerceAtLeast(320)
    val isDark = isSystemInDarkTheme()
    val containerBg = if (isDark) DarkBackground else LightBackground
    val dividerColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)

    val adaptiveSize = remember(context, screenWidthDp) {
        try {
            AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(context, screenWidthDp)
        } catch (_: Throwable) {
            AdSize.BANNER
        }
    }

    val reservedHeightDp = remember(adaptiveSize, context, density) {
        try {
            val px = adaptiveSize.getHeightInPixels(context)
            if (px > 0) with(density) { px.toDp() } else 50.dp
        } catch (_: Throwable) {
            50.dp
        }
    }

    var isLoaded by remember(screen) { mutableStateOf(false) }
    var hasFailed by remember(screen) { mutableStateOf(false) }

    // Collapse to 0 height when ad fails to load
    if (hasFailed) {
        return
    }

    val adView = remember(screen, adaptiveSize) {
        try {
            AdView(context).apply {
                adUnitId = AdConfig.bannerUnitId
                setAdSize(adaptiveSize)
                setOnPaidEventListener { adValue ->
                    AnalyticsManager.logAdImpression(
                        adUnitId = AdConfig.bannerUnitId,
                        adFormat = "banner",
                        valueMicros = adValue.valueMicros,
                        currencyCode = adValue.currencyCode
                    )
                }
                adListener = object : AdListener() {
                    override fun onAdLoaded() {
                        isLoaded = true
                        hasFailed = false
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        isLoaded = false
                        hasFailed = true
                        CrashlyticsHelper.logAdBreadcrumb("Banner load failed: ${error.code} - ${error.message}")
                    }
                }
                loadAd(AdRequest.Builder().build())
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("BannerCreate", t)
            hasFailed = true
            null
        }
    }

    DisposableEffect(adView) {
        onDispose {
            try {
                adView?.destroy()
            } catch (_: Throwable) {
            }
        }
    }

    if (adView == null) {
        return
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(containerBg),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalDivider(
            thickness = 1.dp,
            color = if (isLoaded) dividerColor else Color.Transparent
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp)
                .height(reservedHeightDp),
            contentAlignment = Alignment.Center
        ) {
            AndroidView(
                factory = { adView },
                modifier = Modifier
                    .fillMaxWidth()
                    .alpha(if (isLoaded) 1f else 0f)
            )
        }
    }
}
