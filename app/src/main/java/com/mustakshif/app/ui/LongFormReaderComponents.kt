package com.mustakshif.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mustakshif.app.R
import com.mustakshif.app.data.LongFormChapter
import com.mustakshif.app.data.LongFormEntry
import com.mustakshif.app.data.LongFormResumeState
import com.mustakshif.app.data.MythModel
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.theme.CoolBlueAccent
import com.mustakshif.app.theme.CoolBlueTint
import com.mustakshif.app.theme.DarkBackground
import com.mustakshif.app.theme.DarkCoolBlueAccent
import com.mustakshif.app.theme.DarkCoolBlueTint
import com.mustakshif.app.theme.DarkPrimaryMint
import com.mustakshif.app.theme.DarkSurface
import com.mustakshif.app.theme.DarkTextPrimary
import com.mustakshif.app.theme.DarkTextSecondary
import com.mustakshif.app.theme.LightSurface
import com.mustakshif.app.theme.LightTextPrimary
import com.mustakshif.app.theme.LightTextSecondary
import com.mustakshif.app.theme.PrimaryEmerald
import com.mustakshif.app.theme.PrimaryMint

/**
 * First element of Home, above category tiles:
 * - While inactive: Gradient #E8F1FB -> #F2FBF7, border #4A90D9, title #0E5C4D,
 *   "افتح كل القصص الطويلة وأزل الإعلانات", "اشترك" button, and Settings gear -> "الاشتراك".
 * - While active: "Premium مفعّل ✓" chip navigating to "الاشتراك".
 */
@Composable
fun HomePremiumBanner(
    hasPremiumMonthly: Boolean,
    onOpenSubscription: () -> Unit,
    modifier: Modifier = Modifier
) {
    LaunchedEffect(hasPremiumMonthly) {
        if (!hasPremiumMonthly) {
            AnalyticsManager.logPremiumBannerView()
        }
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        if (hasPremiumMonthly) {
            Surface(
                modifier = modifier
                    .clickable(onClick = onOpenSubscription),
                shape = RoundedCornerShape(999.dp),
                color = Color(0xFF3DDC97).copy(alpha = 0.2f),
                border = BorderStroke(1.dp, Color(0xFF3DDC97))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = stringResource(R.string.home_banner_active_chip),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0E5C4D)
                    )
                }
            }
        } else {
            Surface(
                modifier = modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                border = BorderStroke(1.5.dp, Color(0xFF4A90D9))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(Color(0xFFE8F1FB), Color(0xFFF2FBF7))
                            )
                        )
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = stringResource(R.string.home_banner_title),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0E5C4D),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = onOpenSubscription,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF4A90D9),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(999.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.home_banner_cta),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    IconButton(onClick = onOpenSubscription) {
                        Icon(
                            imageVector = Icons.Rounded.Settings,
                            contentDescription = stringResource(R.string.subscription_screen_title),
                            tint = Color(0xFF0E5C4D)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Entry Card honoring Requirement 3 (Locked Card State):
 * When entry.isPremium && !hasPremiumMonthly:
 * - Hero media container rendered at alpha 0.55f
 * - Lock icon (18.dp) in top-start corner
 * - "Premium" pill with #4A90D9 background and white text
 * - Title and summary kept at full opacity (1f)
 */
@Composable
fun MythEntryCard(
    entry: MythModel,
    hasPremiumMonthly: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val isLocked = entry.isPremium && !hasPremiumMonthly
    val surfaceColor = if (isDark) DarkSurface else LightSurface
    val borderColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)
    val textPrimary = if (isDark) DarkTextPrimary else LightTextPrimary
    val textSecondary = if (isDark) DarkTextSecondary else LightTextSecondary

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .clickable(onClick = onClick),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = surfaceColor),
            border = BorderStroke(1.dp, borderColor)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .background(
                            color = (if (isDark) DarkCoolBlueTint else CoolBlueTint)
                                .copy(alpha = if (isLocked) 0.55f else 1f),
                            shape = RoundedCornerShape(12.dp)
                        )
                ) {
                    if (isLocked) {
                        Surface(
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(8.dp),
                            shape = CircleShape,
                            color = Color.Black.copy(alpha = 0.55f)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Lock,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier
                                    .padding(6.dp)
                                    .size(18.dp)
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (entry.isLongForm) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = PrimaryMint
                            ) {
                                Text(
                                    text = stringResource(R.string.badge_long_form),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF0E5C4D),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                        if (entry.isPremium) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = Color(0xFF4A90D9)
                            ) {
                                Text(
                                    text = stringResource(R.string.badge_premium),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = entry.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary,
                    modifier = Modifier.alpha(1f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = entry.summary,
                    style = MaterialTheme.typography.bodySmall,
                    color = textSecondary,
                    maxLines = 2,
                    modifier = Modifier.alpha(1f)
                )
            }
        }
    }
}

/**
 * Library Badges Row ("طويلة" + "Premium") in strict teal / mint / cool-blue palette.
 */
@Composable
fun LongFormLibraryBadges(
    isLongForm: Boolean,
    isPremium: Boolean,
    modifier: Modifier = Modifier
) {
    if (!isLongForm && !isPremium) return
    val isDark = isSystemInDarkTheme()

    val mintBg = if (isDark) Color(0xFF1A4B3E) else PrimaryMint
    val mintFg = if (isDark) DarkPrimaryMint else PrimaryEmerald

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Row(
            modifier = modifier,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (isLongForm) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = mintBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.AutoStories,
                            contentDescription = null,
                            tint = mintFg,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = stringResource(R.string.badge_long_form),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = mintFg
                        )
                    }
                }
            }
            if (isPremium) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = Color(0xFF4A90D9)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.WorkspacePremium,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = stringResource(R.string.badge_premium),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

/**
 * Evidence Pill rendered per chapter (e.g., "نص ديني", "أسطوري", "خيال أدبي", "موثق تاريخياً").
 */
@Composable
fun ChapterEvidencePill(
    evidenceLabel: String,
    modifier: Modifier = Modifier
) {
    if (evidenceLabel.isBlank()) return
    val isDark = isSystemInDarkTheme()
    val isDocumented = evidenceLabel == "موثق تاريخياً" || evidenceLabel == "نص قرآني" || evidenceLabel == "نص ديني"
    val bgColor = when {
        isDocumented -> if (isDark) Color(0xFF1A4B3E) else PrimaryMint.copy(alpha = 0.28f)
        else -> if (isDark) DarkCoolBlueTint else CoolBlueTint
    }
    val fgColor = when {
        isDocumented -> if (isDark) DarkPrimaryMint else PrimaryEmerald
        else -> if (isDark) DarkCoolBlueAccent else CoolBlueAccent
    }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(999.dp),
        color = bgColor,
        border = BorderStroke(1.dp, fgColor.copy(alpha = 0.35f))
    ) {
        Text(
            text = evidenceLabel,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = fgColor,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
        )
    }
}

/**
 * Resume Reading Banner for a multi-chapter long-form entry.
 */
@Composable
fun LongFormResumeBanner(
    entry: LongFormEntry,
    resumeState: LongFormResumeState?,
    overallProgressPercent: Int,
    onResumeChapter: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val surfaceColor = if (isDark) DarkSurface else LightSurface
    val borderColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)
    val accentPrimary = if (isDark) DarkPrimaryMint else PrimaryEmerald
    val textPrimary = if (isDark) DarkTextPrimary else LightTextPrimary
    val textSecondary = if (isDark) DarkTextSecondary else LightTextSecondary
    val targetChapterIndex = resumeState?.lastChapterIndex ?: 0

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = surfaceColor),
            border = BorderStroke(1.dp, borderColor)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (resumeState != null) {
                            resumeState.lastChapterTitle
                        } else {
                            entry.chapters.firstOrNull()?.title.orEmpty()
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "$overallProgressPercent%",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = accentPrimary
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { (overallProgressPercent.coerceIn(0, 100)) / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    color = accentPrimary,
                    trackColor = borderColor
                )
                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = { onResumeChapter(targetChapterIndex) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = accentPrimary,
                        contentColor = if (isDark) DarkBackground else Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = stringResource(
                            if (resumeState != null) R.string.long_form_resume else R.string.long_form_start_chapter_1
                        ),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (resumeState != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "التقدم في الفصل الحالي: ${resumeState.chapterProgressPercent}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = textSecondary
                    )
                }
            }
        }
    }
}

/**
 * Chapter Card showing:
 * - Chapter title, FREE teaser badge for Chapter 1, or lock card for Chapters 2+
 * - When locked: benefits list, localized Play price, "اشترك الآن" button, and "استعادة المشتريات" button
 */
@Composable
fun LongFormChapterCard(
    chapter: LongFormChapter,
    isUnlocked: Boolean,
    chapterProgressPercent: Int,
    localizedPrice: String,
    onReadChapter: () -> Unit,
    onUnlockPremium: () -> Unit,
    onRestorePurchases: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val surfaceColor = if (isDark) DarkSurface else LightSurface
    val borderColor = if (isDark) Color(0xFF1C443C) else Color(0xFFD7EFE6)
    val accentPrimary = if (isDark) DarkPrimaryMint else PrimaryEmerald
    val accentBlue = if (isDark) DarkCoolBlueAccent else CoolBlueAccent
    val textPrimary = if (isDark) DarkTextPrimary else LightTextPrimary
    val textSecondary = if (isDark) DarkTextSecondary else LightTextSecondary

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = surfaceColor),
            border = BorderStroke(1.dp, borderColor)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ChapterEvidencePill(evidenceLabel = chapter.evidenceLabel)

                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = if (chapter.isFree || chapter.index == 0) {
                            if (isDark) Color(0xFF1A4B3E) else PrimaryMint.copy(alpha = 0.28f)
                        } else {
                            Color(0xFF4A90D9)
                        }
                    ) {
                        Text(
                            text = if (chapter.isFree || chapter.index == 0) {
                                stringResource(R.string.long_form_free_teaser)
                            } else if (isUnlocked) {
                                stringResource(R.string.badge_premium)
                            } else {
                                stringResource(R.string.long_form_locked_badge)
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (chapter.isFree || chapter.index == 0) accentPrimary else Color.White,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = chapter.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary
                )

                Spacer(modifier = Modifier.height(8.dp))

                if (chapterProgressPercent > 0) {
                    LinearProgressIndicator(
                        progress = { chapterProgressPercent.coerceIn(0, 100) / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(5.dp),
                        color = accentPrimary,
                        trackColor = borderColor
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                if (isUnlocked) {
                    if (chapter.paragraphs.isNotEmpty()) {
                        chapter.paragraphs.forEach { paragraph ->
                            Text(
                                text = paragraph,
                                style = MaterialTheme.typography.bodyLarge,
                                color = textPrimary,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = if (isDark) DarkCoolBlueTint else CoolBlueTint,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.long_form_batch_pending),
                                style = MaterialTheme.typography.bodyMedium,
                                color = textSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = onReadChapter,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = accentPrimary,
                            contentColor = if (isDark) DarkBackground else Color.White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = if (chapterProgressPercent >= 100) {
                                stringResource(R.string.long_form_chapter_completed)
                            } else {
                                stringResource(R.string.long_form_mark_progress)
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                } else {
                    LaunchedEffect(chapter.id) {
                        AnalyticsManager.logPaywallView("chapter_lock_card")
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                color = if (isDark) DarkCoolBlueTint else CoolBlueTint,
                                shape = RoundedCornerShape(14.dp)
                            )
                            .padding(14.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Rounded.Lock,
                                    contentDescription = null,
                                    tint = accentBlue,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = stringResource(R.string.long_form_unlock_prompt),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                listOf(
                                    stringResource(R.string.subscription_benefit_stories),
                                    stringResource(R.string.subscription_benefit_ads)
                                ).forEach { benefit ->
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Rounded.CheckCircle,
                                            contentDescription = null,
                                            tint = accentPrimary,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = benefit,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = textPrimary
                                        )
                                    }
                                }
                            }

                            if (localizedPrice.isNotBlank()) {
                                Text(
                                    text = "$localizedPrice / شهرياً",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = accentBlue
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = onUnlockPremium,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF4A90D9),
                                        contentColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        text = stringResource(R.string.long_form_unlock_cta),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                OutlinedButton(
                                    onClick = onRestorePurchases,
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, accentBlue.copy(alpha = 0.5f)),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        text = stringResource(R.string.long_form_restore_cta),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = accentBlue
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
