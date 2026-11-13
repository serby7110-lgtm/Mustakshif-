package com.mustakshif.app.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp

/**
 * Mustakshif Arabic Typography.
 * Body fonts: Cairo / Tajawal / Sans-serif with full Arabic shaping.
 * Display fonts: Amiri / Aref Ruqaa / Serif with classical Arabic proportions.
 */

val ArabicBodyFont = FontFamily.SansSerif
val ArabicDisplayFont = FontFamily.Serif

val MustakshifTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = ArabicDisplayFont,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 40.sp,
        textAlign = TextAlign.Start
    ),
    headlineMedium = TextStyle(
        fontFamily = ArabicDisplayFont,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 32.sp,
        textAlign = TextAlign.Start
    ),
    titleLarge = TextStyle(
        fontFamily = ArabicBodyFont,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 28.sp,
        textAlign = TextAlign.Start
    ),
    titleMedium = TextStyle(
        fontFamily = ArabicBodyFont,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        textAlign = TextAlign.Start
    ),
    bodyLarge = TextStyle(
        fontFamily = ArabicBodyFont,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 28.sp,
        textAlign = TextAlign.Start
    ),
    bodyMedium = TextStyle(
        fontFamily = ArabicBodyFont,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 24.sp,
        textAlign = TextAlign.Start
    ),
    labelSmall = TextStyle(
        fontFamily = ArabicBodyFont,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        textAlign = TextAlign.Start
    )
)
