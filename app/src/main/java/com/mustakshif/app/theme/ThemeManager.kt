package com.mustakshif.app.theme

import android.content.Context
import android.os.Build
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.appcompat.app.AppCompatDelegate

/**
 * Handles Dark/Light theme modes and WebView force-dark guards:
 * - force-dark / setForceDark is only invoked on Android 10+ (API 29+)
 * - AppCompatDelegate handles system and manual night mode safely on API 21+
 */
object ThemeManager {

    const val MODE_LIGHT = 0
    const val MODE_DARK = 1
    const val MODE_SYSTEM = 2

    fun applyTheme(mode: Int) {
        val nightMode = when (mode) {
            MODE_DARK -> AppCompatDelegate.MODE_NIGHT_YES
            MODE_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            else -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
            } else {
                AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
            }
        }
        AppCompatDelegate.setDefaultNightMode(nightMode)
    }

    /**
     * Safely applies force dark to WebView without crashing on Android 5.0 - 9.0 (API 21 - 28)
     */
    fun configureWebViewDarkTheme(webView: WebView, isDark: Boolean) {
        val settings = webView.settings
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // setForceDark is an API 29+ method
            settings.forceDark = if (isDark) {
                WebSettings.FORCE_DARK_ON
            } else {
                WebSettings.FORCE_DARK_OFF
            }
        }
    }
}
