package com.mustakshif.app.storage

import android.content.Context
import com.mustakshif.app.data.LongFormChapter
import com.mustakshif.app.data.LongFormEntry
import com.mustakshif.app.data.LongFormResumeState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

/**
 * Offline-first per-chapter progress & resume store for Mustakshif long-form entries.
 * Tracks reading percent (0..100) for every chapterId and remembers the last active chapter
 * so the reader can resume seamlessly. Safe on Android API 21+.
 */
object LongFormProgressStore {

    private const val PREFS_NAME = "mustakshif_long_form_progress"
    private const val KEY_CHAPTER_PROGRESS_JSON = "chapter_progress_map"
    private const val KEY_RESUME_MAP_JSON = "entry_resume_map"

    private val _chapterProgress = MutableStateFlow<Map<String, Int>>(emptyMap())
    val chapterProgress: StateFlow<Map<String, Int>> = _chapterProgress.asStateFlow()

    private val _resumeStates = MutableStateFlow<Map<String, LongFormResumeState>>(emptyMap())
    val resumeStates: StateFlow<Map<String, LongFormResumeState>> = _resumeStates.asStateFlow()

    fun init(context: Context) {
        try {
            val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val progressRaw = prefs.getString(KEY_CHAPTER_PROGRESS_JSON, "{}") ?: "{}"
            val resumeRaw = prefs.getString(KEY_RESUME_MAP_JSON, "{}") ?: "{}"

            val parsedProgress = mutableMapOf<String, Int>()
            val progressObj = JSONObject(progressRaw)
            val progressKeys = progressObj.keys()
            while (progressKeys.hasNext()) {
                val key = progressKeys.next()
                parsedProgress[key] = progressObj.optInt(key, 0).coerceIn(0, 100)
            }
            _chapterProgress.value = parsedProgress

            val parsedResume = mutableMapOf<String, LongFormResumeState>()
            val resumeObj = JSONObject(resumeRaw)
            val resumeKeys = resumeObj.keys()
            while (resumeKeys.hasNext()) {
                val entryId = resumeKeys.next()
                val item = resumeObj.optJSONObject(entryId) ?: continue
                parsedResume[entryId] = LongFormResumeState(
                    entryId = entryId,
                    lastChapterIndex = item.optInt("lastChapterIndex", 0),
                    lastChapterId = item.optString("lastChapterId", ""),
                    lastChapterTitle = item.optString("lastChapterTitle", ""),
                    chapterProgressPercent = item.optInt("chapterProgressPercent", 0).coerceIn(0, 100),
                    updatedAtEpochMs = item.optLong("updatedAtEpochMs", 0L)
                )
            }
            _resumeStates.value = parsedResume
        } catch (_: Throwable) {
        }
    }

    fun getChapterProgress(entryId: String, chapterId: String): Int {
        return _chapterProgress.value[chapterKey(entryId, chapterId)] ?: 0
    }

    fun getOverallEntryProgress(entry: LongFormEntry): Int {
        if (entry.chapters.isEmpty()) return 0
        val total = entry.chapters.sumOf { ch -> getChapterProgress(entry.id, ch.id) }
        return (total / entry.chapters.size).coerceIn(0, 100)
    }

    fun getResumeState(entryId: String): LongFormResumeState? {
        return _resumeStates.value[entryId]
    }

    fun recordChapterProgress(
        context: Context,
        entryId: String,
        chapter: LongFormChapter,
        progressPercent: Int
    ) {
        val clamped = progressPercent.coerceIn(0, 100)
        val key = chapterKey(entryId, chapter.id)

        val updatedProgress = _chapterProgress.value.toMutableMap().apply {
            val previous = this[key] ?: 0
            this[key] = maxOf(previous, clamped)
        }
        _chapterProgress.value = updatedProgress

        val resume = LongFormResumeState(
            entryId = entryId,
            lastChapterIndex = chapter.index,
            lastChapterId = chapter.id,
            lastChapterTitle = chapter.title,
            chapterProgressPercent = clamped,
            updatedAtEpochMs = System.currentTimeMillis()
        )
        val updatedResume = _resumeStates.value.toMutableMap().apply {
            this[entryId] = resume
        }
        _resumeStates.value = updatedResume

        persistState(context.applicationContext, updatedProgress, updatedResume)
    }

    private fun persistState(
        context: Context,
        progressMap: Map<String, Int>,
        resumeMap: Map<String, LongFormResumeState>
    ) {
        try {
            val progressObj = JSONObject()
            for ((k, v) in progressMap) {
                progressObj.put(k, v)
            }

            val resumeObj = JSONObject()
            for ((entryId, state) in resumeMap) {
                val itemObj = JSONObject().apply {
                    put("lastChapterIndex", state.lastChapterIndex)
                    put("lastChapterId", state.lastChapterId)
                    put("lastChapterTitle", state.lastChapterTitle)
                    put("chapterProgressPercent", state.chapterProgressPercent)
                    put("updatedAtEpochMs", state.updatedAtEpochMs)
                }
                resumeObj.put(entryId, itemObj)
            }

            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_CHAPTER_PROGRESS_JSON, progressObj.toString())
                .putString(KEY_RESUME_MAP_JSON, resumeObj.toString())
                .apply()
        } catch (_: Throwable) {
        }
    }

    private fun chapterKey(entryId: String, chapterId: String): String = "$entryId:$chapterId"
}
