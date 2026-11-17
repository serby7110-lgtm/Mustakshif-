package com.mustakshif.app.ui

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Restore
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mustakshif.app.R
import com.mustakshif.app.data.EntitlementManager
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.theme.CoolBlueAccent
import com.mustakshif.app.theme.DarkCoolBlueAccent
import com.mustakshif.app.theme.DarkSurface
import com.mustakshif.app.theme.DarkTextPrimary
import com.mustakshif.app.theme.DarkTextSecondary
import com.mustakshif.app.theme.LightSurface
import com.mustakshif.app.theme.LightTextPrimary
import com.mustakshif.app.theme.LightTextSecondary
import com.mustakshif.app.theme.PrimaryEmerald

/**
 * Subscription Screen ("الاشتراك") for Mustakshif.
 * Displays entitlement status ("مفعّل" #3DDC97 / "غير مفعّل" muted), renewal date,
 * benefits list, Play price & billing period, activate/restore/manage actions,
 * and consumable tip products (tip_1, tip_3, tip_5).
 */
@Composable
fun SubscriptionScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val isDark = isSystemInDarkTheme()

    val hasPremium by EntitlementManager.hasPremiumMonthly.collectAsState()
    val isBillingAvailable by EntitlementManager.isBillingAvailable.collectAsState()
    val formattedPrice by EntitlementManager.formattedPrice.collectAsState()
    val billingPeriod by EntitlementManager.billingPeriodLabel.collectAsState()
    val renewalDate by EntitlementManager.renewalDateText.collectAsState()
    val tipPrices by EntitlementManager.tipPrices.collectAsState()
    val statusMessage by EntitlementManager.statusMessage.collectAsState()

    val surfaceColor = if (isDark) DarkSurface else LightSurface
    val borderColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)
    val textPrimary = if (isDark) DarkTextPrimary else LightTextPrimary
    val textSecondary = if (isDark) DarkTextSecondary else LightTextSecondary
    val accentEmerald = if (isDark) Color(0xFF9FE8CC) else PrimaryEmerald
    val accentBlue = if (isDark) DarkCoolBlueAccent else CoolBlueAccent

    LaunchedEffect(Unit) {
        AnalyticsManager.logPaywallView("subscription_screen")
    }

    LaunchedEffect(statusMessage) {
        statusMessage?.let { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            EntitlementManager.clearStatusMessage()
        }
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Column(
            modifier = modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = null,
                        tint = accentEmerald
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.subscription_screen_title),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = accentEmerald
                )
            }

            if (!isBillingAvailable) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFFE8F1FB),
                    border = BorderStroke(1.dp, Color(0xFF4A90D9))
                ) {
                    Text(
                        text = stringResource(R.string.subscription_unavailable),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF0E5C4D),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            // Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = surfaceColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "حالة الاشتراك",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Text(
                            text = stringResource(
                                if (hasPremium) R.string.subscription_status_active else R.string.subscription_status_inactive
                            ),
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = if (hasPremium) Color(0xFF3DDC97) else textSecondary
                        )
                    }

                    if (!renewalDate.isNullOrBlank()) {
                        Text(
                            text = "تاريخ التجديد: $renewalDate",
                            style = MaterialTheme.typography.bodySmall,
                            color = textSecondary
                        )
                    }

                    if (formattedPrice.isNotBlank()) {
                        Text(
                            text = "$formattedPrice • $billingPeriod (${EntitlementManager.PRODUCT_PREMIUM_MONTHLY})",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = accentBlue
                        )
                    }
                }
            }

            // Benefits Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = surfaceColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "مزايا Premium",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )
                    listOf(
                        stringResource(R.string.subscription_benefit_stories),
                        stringResource(R.string.subscription_benefit_ads)
                    ).forEach { benefit ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF3DDC97),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = benefit,
                                style = MaterialTheme.typography.bodyMedium,
                                color = textPrimary
                            )
                        }
                    }
                }
            }

            // Primary Actions
            Button(
                onClick = { activity?.let { EntitlementManager.launchPurchaseFlow(it) } },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF4A90D9),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Icon(imageVector = Icons.Rounded.WorkspacePremium, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.subscription_activate_cta),
                    fontWeight = FontWeight.Bold
                )
            }

            OutlinedButton(
                onClick = { EntitlementManager.restorePurchases(context) },
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, accentBlue.copy(alpha = 0.5f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Icon(imageVector = Icons.Rounded.Restore, contentDescription = null, tint = accentBlue)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.subscription_restore_cta),
                    color = accentBlue,
                    fontWeight = FontWeight.Bold
                )
            }

            OutlinedButton(
                onClick = {
                    AnalyticsManager.logManageSubscription()
                    val intent = Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse(EntitlementManager.MANAGE_SUBSCRIPTIONS_URL)
                    )
                    context.startActivity(intent)
                },
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, borderColor),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text(
                    text = stringResource(R.string.subscription_manage_cta),
                    color = textPrimary,
                    fontWeight = FontWeight.Bold
                )
            }

            // Consumable Tips Row (tip_1, tip_3, tip_5)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = surfaceColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.Favorite,
                            contentDescription = null,
                            tint = accentBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "دعم استمرار الموسوعة (إكرامية)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            EntitlementManager.PRODUCT_TIP_1 to "دعم بسيط",
                            EntitlementManager.PRODUCT_TIP_3 to "دعم متوسط",
                            EntitlementManager.PRODUCT_TIP_5 to "دعم سخي"
                        ).forEach { (productId, fallbackLabel) ->
                            val label = tipPrices[productId] ?: fallbackLabel
                            OutlinedButton(
                                onClick = {
                                    activity?.let {
                                        EntitlementManager.launchTipPurchaseFlow(it, productId)
                                    }
                                },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, borderColor),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = accentEmerald
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
