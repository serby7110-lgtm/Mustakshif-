package com.mustakshif.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = DarkBackground,
    primaryContainer = DarkPrimaryMint,
    onPrimaryContainer = DarkBackground,
    secondary = DarkCoolBlueAccent,
    onSecondary = DarkBackground,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkCoolBlueTint,
    onSurfaceVariant = DarkTextSecondary
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryEmerald,
    onPrimary = LightSurface,
    primaryContainer = PrimaryMint,
    onPrimaryContainer = PrimaryEmerald,
    secondary = CoolBlueAccent,
    onSecondary = LightSurface,
    background = LightBackground,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = CoolBlueTint,
    onSurfaceVariant = LightTextSecondary
)

/**
 * Mustakshif Theme.
 * Enforces:
 * 1. Exact Teal/Emerald/Mint/Cool-Blue palette (zero brown or gold).
 * 2. DayNight support across API 21 through 35+.
 * 3. Strict RTL layout direction app-wide.
 */
@Composable
fun MustakshifTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    // Enforce RTL across every screen and component
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = MustakshifTypography,
            content = content
        )
    }
}
