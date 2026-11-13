package com.mustakshif.app.ads

import android.app.Activity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.PrivacyTip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mustakshif.app.R
import com.mustakshif.app.firebase.RemoteConfigManager
import com.mustakshif.app.theme.CoolBlueAccent
import com.mustakshif.app.theme.DarkCoolBlueAccent
import com.mustakshif.app.theme.DarkTextPrimary
import com.mustakshif.app.theme.DarkTextSecondary
import com.mustakshif.app.theme.LightTextSecondary
import com.mustakshif.app.theme.PrimaryEmerald

/**
 * Profile Ad Transparency Section:
 * - Profile disclosure note: "قد يعرض التطبيق إعلانات لدعم استمراريته."
 * - Optional UMP privacy settings button when required by region
 */
@Composable
fun ProfileAdSection(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val isDark = isSystemInDarkTheme()

    val borderColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)
    val accentBlue = if (isDark) DarkCoolBlueAccent else CoolBlueAccent
    val titleColor = if (isDark) DarkTextPrimary else PrimaryEmerald
    val subtitleColor = if (isDark) DarkTextSecondary else LightTextSecondary

    val privacyRequired by ConsentManager.isPrivacyOptionsRequired.collectAsState()
    val remoteConfig by RemoteConfigManager.values.collectAsState()

    if (!remoteConfig.adsEnabled && !privacyRequired) {
        return
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Column(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            if (privacyRequired && activity != null) {
                OutlinedButton(
                    onClick = { ConsentManager.showPrivacyOptionsForm(activity) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, borderColor)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.PrivacyTip,
                        contentDescription = stringResource(R.string.ad_privacy_options),
                        tint = accentBlue
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.ad_privacy_options),
                        color = titleColor
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            if (remoteConfig.adsEnabled) {
                Text(
                    text = stringResource(R.string.ad_profile_disclosure),
                    style = MaterialTheme.typography.bodyMedium,
                    color = subtitleColor,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
            }
        }
    }
}
