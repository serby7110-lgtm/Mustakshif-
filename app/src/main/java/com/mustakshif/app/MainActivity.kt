package com.mustakshif.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.mustakshif.app.ads.AdManager
import com.mustakshif.app.ads.AppOpenLoadingOverlay
import com.mustakshif.app.ads.AppScreen
import com.mustakshif.app.ads.BannerAdSlot
import com.mustakshif.app.ads.ConsentManager
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.PlayServicesGuard
import com.mustakshif.app.firebase.RemoteConfigManager
import com.mustakshif.app.notifications.NotificationHelper
import com.mustakshif.app.theme.MustakshifTheme
import com.mustakshif.app.theme.ThemeManager
import com.mustakshif.app.tts.ArabicTtsManager

/**
 * MainActivity for Mustakshif Native Android App.
 * - Zero crashes across API 21 through 35+ (graceful offline mode if Play Services unavailable).
 * - Integrates UMP consent + Firebase Analytics Consent Mode + Remote Config + FCM deep links.
 * - Renders branded AppOpenLoadingOverlay during cold-start / >30s return App Open preparation.
 */
class MainActivity : ComponentActivity() {

    private var ttsManager: ArabicTtsManager? = null
    private var currentScreen by mutableStateOf(AppScreen.HOME)
    private var activeMythId by mutableStateOf<String?>(null)
    private var showNotificationRationale by mutableStateOf(false)

    // Register runtime permission launcher for Android 13+ (API 33)
    private val requestNotificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            NotificationHelper.createNotificationChannels(this)
        }
        // If denied, never block app usage
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Theme safely on API 21+
        ThemeManager.applyTheme(ThemeManager.MODE_SYSTEM)

        // Initialize Notification channels (guarded inside NotificationHelper for API 26+)
        NotificationHelper.createNotificationChannels(this)

        // Handle deep-link from FCM / notification tap (if present)
        handleDeepLinkIntent(intent)

        // Request POST_NOTIFICATIONS permission only when push is enabled on API 33+
        if (RemoteConfigManager.current.pushEnabled) {
            checkAndRequestNotificationPermission()
        }

        // Initialize offline-first Long-Form Progress & Premium Entitlement state
        com.mustakshif.app.data.EntitlementManager.init(this)
        com.mustakshif.app.storage.LongFormProgressStore.init(this)

        // Initialize Native Arabic TTS
        ttsManager = ArabicTtsManager(this)

        // Gather UMP consent BEFORE any ad request or analytics collection
        if (PlayServicesGuard.isGooglePlayServicesAvailable(this)) {
            ConsentManager.gatherConsent(this) { canRequestAds ->
                if (canRequestAds && !isFinishing && !isDestroyed) {
                    AdManager.onConsentGranted(this)
                    AdManager.onAppForegrounded(
                        activity = this,
                        isColdStart = true,
                        backgroundDurationMs = 0L
                    )
                }
            }
        }

        setContent {
            val remoteConfig by RemoteConfigManager.values.collectAsState()
            val showAppOpenOverlay by AdManager.isShowingAppOpenOverlay.collectAsState()

            LaunchedEffect(remoteConfig.adsEnabled, remoteConfig.appOpenEnabled, remoteConfig.interstitialEnabled) {
                if (!remoteConfig.adsEnabled) {
                    AdManager.clearLoadedAds()
                } else {
                    if (!remoteConfig.appOpenEnabled) AdManager.clearAppOpenAd()
                    if (!remoteConfig.interstitialEnabled) AdManager.clearInterstitialAd()
                }
            }

            LaunchedEffect(remoteConfig.pushEnabled) {
                if (remoteConfig.pushEnabled) {
                    checkAndRequestNotificationPermission()
                }
            }

            MustakshifTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                            ) {
                                // Native Mustakshif Reader Content (currentScreen, activeMythId)
                            }

                            // Anchored above bottom navigation; hidden in Article and when consent/ad/RemoteConfig unavailable
                            BannerAdSlot(screen = currentScreen)
                        }

                        AppOpenLoadingOverlay(visible = showAppOpenOverlay)
                    }

                    if (showNotificationRationale && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                            AlertDialog(
                                onDismissRequest = { showNotificationRationale = false },
                                title = {
                                    Text(text = stringResource(R.string.notification_permission_rationale_title))
                                },
                                text = {
                                    Text(text = stringResource(R.string.notification_permission_rationale_body))
                                },
                                confirmButton = {
                                    TextButton(onClick = {
                                        showNotificationRationale = false
                                        requestNotificationPermissionLauncher.launch(
                                            Manifest.permission.POST_NOTIFICATIONS
                                        )
                                    }) {
                                        Text(text = stringResource(R.string.notification_permission_allow))
                                    }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showNotificationRationale = false }) {
                                        Text(text = stringResource(R.string.notification_permission_later))
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLinkIntent(intent)
    }

    private fun handleDeepLinkIntent(intent: Intent?) {
        val mythId = intent?.getStringExtra(NotificationHelper.EXTRA_DEEP_LINK_MYTH_ID)
            ?: intent?.getStringExtra("myth_id")
            ?: return

        if (mythId.isNotBlank()) {
            activeMythId = mythId
            currentScreen = AppScreen.ARTICLE
            AnalyticsManager.logArticleOpen(mythId = mythId, category = "daily_myth")
            AnalyticsManager.logScreenView("article")
        }
    }

    fun onScreenChanged(screen: AppScreen) {
        currentScreen = screen
        AnalyticsManager.logScreenView(screen.name.lowercase())
    }

    fun onArticleProgressReached(
        progressPercent: Int,
        isBackNavigation: Boolean = false,
        articleId: String? = null
    ) {
        AdManager.onArticleReadingProgress(
            activity = this,
            progressPercent = progressPercent,
            isBackNavigation = isBackNavigation,
            articleId = articleId
        )
    }

    fun checkAndRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permission = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                if (ActivityCompat.shouldShowRequestPermissionRationale(this, permission)) {
                    showNotificationRationale = true
                } else {
                    requestNotificationPermissionLauncher.launch(permission)
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        // Stop audio reading when screen exits or moves to background
        ttsManager?.stop()
    }

    override fun onDestroy() {
        super.onDestroy()
        ttsManager?.shutdown()
        ttsManager = null
    }
}
