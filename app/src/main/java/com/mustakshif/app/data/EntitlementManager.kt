package com.mustakshif.app.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Offline-first subscription entitlement manager for Mustakshif.
 * Controls access to chapters 2+ of premium long-form entries via "premium_monthly".
 * Compatible with Android API 21+.
 */
object EntitlementManager {

    const val PRODUCT_PREMIUM_MONTHLY = LongFormEntry.PREMIUM_MONTHLY_PRODUCT_ID

    private const val PREFS_NAME = "mustakshif_entitlements"
    private const val KEY_PREMIUM_MONTHLY = "entitlement_premium_monthly"

    private val _hasPremiumMonthly = MutableStateFlow(false)
    val hasPremiumMonthly: StateFlow<Boolean> = _hasPremiumMonthly.asStateFlow()

    fun init(context: Context) {
        _hasPremiumMonthly.value = try {
            val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.getBoolean(KEY_PREMIUM_MONTHLY, false)
        } catch (_: Throwable) {
            false
        }
    }

    fun setPremiumMonthlyActive(context: Context, active: Boolean) {
        _hasPremiumMonthly.value = active
        try {
            context.applicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_PREMIUM_MONTHLY, active)
                .apply()
        } catch (_: Throwable) {
        }
    }

    fun isChapterUnlocked(entry: LongFormEntry, chapterIndex: Int): Boolean {
        return entry.isChapterUnlocked(chapterIndex, _hasPremiumMonthly.value)
    }
}
