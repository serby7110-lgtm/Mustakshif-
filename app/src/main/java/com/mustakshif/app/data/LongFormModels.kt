package com.mustakshif.app.data

/**
 * Long-Form & Premium Encyclopedia Schema for Mustakshif (API 21+, offline-first).
 * Supports multi-chapter works (including appendices), per-chapter evidence classification pills,
 * Chapter 1 FREE teaser + Chapters 2+ gated behind "premium_monthly", and batch content loading.
 */
data class LongFormChapter(
    val id: String,
    val index: Int,
    val title: String,
    val evidenceLabel: String,
    val isAppendix: Boolean = false,
    val isFree: Boolean = (index == 0),
    val estimatedWords: Int = 0,
    val contentPending: Boolean = false,
    val paragraphs: List<String> = emptyList()
) {
    val isLockedByDefault: Boolean
        get() = !isFree && index > 0
}

data class LongFormEntry(
    val id: String,
    val name: String,
    val latinName: String,
    val category: String,
    val categoryKey: String,
    val entryType: String,
    val isLongForm: Boolean = true,
    val isPremium: Boolean = true,
    val isHistorical: Boolean = false,
    val requiredSubscription: String = PREMIUM_MONTHLY_PRODUCT_ID,
    val heroImage: String,
    val evidenceLabels: List<String>,
    val targetWords: Int,
    val region: String,
    val approxYear: Int,
    val summary: String,
    val body: List<String>,
    val chapters: List<LongFormChapter>
) {
    fun isChapterUnlocked(chapterIndex: Int, hasPremiumMonthly: Boolean): Boolean {
        val chapter = chapters.getOrNull(chapterIndex) ?: return false
        return chapter.index == 0 || chapter.isFree || !isPremium || hasPremiumMonthly
    }

    val freeChaptersCount: Int
        get() = chapters.count { it.index == 0 || it.isFree }

    val mainChaptersCount: Int
        get() = chapters.count { !it.isAppendix }

    val appendicesCount: Int
        get() = chapters.count { it.isAppendix }

    companion object {
        const val PREMIUM_MONTHLY_PRODUCT_ID = "premium_monthly"
        const val BADGE_LONG_FORM = "طويلة"
        const val BADGE_PREMIUM = "Premium"
    }
}

data class LongFormChapterProgress(
    val entryId: String,
    val chapterId: String,
    val chapterIndex: Int,
    val progressPercent: Int,
    val isCompleted: Boolean = progressPercent >= 100
)

data class LongFormResumeState(
    val entryId: String,
    val lastChapterIndex: Int,
    val lastChapterId: String,
    val lastChapterTitle: String,
    val chapterProgressPercent: Int,
    val updatedAtEpochMs: Long
)
