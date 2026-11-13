package com.mustakshif.app.ads

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mustakshif.app.R
import com.mustakshif.app.theme.DarkBackground
import com.mustakshif.app.theme.DarkPrimaryMint
import com.mustakshif.app.theme.DarkTextPrimary
import com.mustakshif.app.theme.DarkTextSecondary
import com.mustakshif.app.theme.LightBackground
import com.mustakshif.app.theme.LightTextSecondary
import com.mustakshif.app.theme.PrimaryEmerald
import com.mustakshif.app.theme.PrimaryMint

/**
 * Branded RTL loading overlay displayed while an App Open ad is preparing (max 5s timeout).
 * Uses the exact Mustakshif light/dark teal-mint palette and eight-pointed star logo.
 */
@Composable
fun AppOpenLoadingOverlay(
    visible: Boolean,
    modifier: Modifier = Modifier
) {
    if (!visible) return

    val isDark = isSystemInDarkTheme()
    val backgroundColor = if (isDark) DarkBackground else LightBackground
    val titleColor = if (isDark) DarkTextPrimary else PrimaryEmerald
    val subtitleColor = if (isDark) DarkTextSecondary else LightTextSecondary
    val progressColor = if (isDark) DarkPrimaryMint else PrimaryMint

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(backgroundColor)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_star_logo),
                    contentDescription = stringResource(R.string.app_name),
                    modifier = Modifier.size(88.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = stringResource(R.string.app_name),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = titleColor
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.app_open_loading_label),
                    style = MaterialTheme.typography.bodyMedium,
                    color = subtitleColor
                )
                Spacer(modifier = Modifier.height(20.dp))
                CircularProgressIndicator(
                    color = progressColor,
                    strokeWidth = 3.dp,
                    modifier = Modifier.size(28.dp)
                )
            }
        }
    }
}
