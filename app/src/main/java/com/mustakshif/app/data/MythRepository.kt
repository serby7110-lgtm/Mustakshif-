package com.mustakshif.app.data

import android.content.Context
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader

data class MythModel(
    val id: String,
    val name: String,
    val typeLabel: String,
    val category: String,
    val summary: String,
    val body: List<String>,
    val region: String,
    val readingTimeMinutes: Int,
    val heroImage: String = "",
    val isLongForm: Boolean = false,
    val isPremium: Boolean = false,
    val isHistorical: Boolean = false,
    val entryType: String = typeLabel,
    val evidenceLabels: List<String> = emptyList(),
    val targetWords: Int = 0
)

/**
 * Offline-first repository that loads local mythology encyclopedia data
 * from packaged assets (myths.json + long_form_entries.json).
 * Completely works on API 21 without network.
 */
class MythRepository(private val context: Context) {

    private var cachedMyths: List<MythModel>? = null
    private var cachedLongFormEntries: List<LongFormEntry>? = null

    fun getMyths(): List<MythModel> {
        cachedMyths?.let { return it }

        val mythsList = mutableListOf<MythModel>()
        try {
            val inputStream = context.assets.open("myths.json")
            val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
            val jsonString = reader.use { it.readText() }

            val jsonArray = JSONArray(jsonString)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val bodyArray = obj.optJSONArray("body") ?: JSONArray()
                val bodyList = mutableListOf<String>()
                for (j in 0 until bodyArray.length()) {
                    bodyList.add(bodyArray.getString(j))
                }

                mythsList.add(
                    MythModel(
                        id = obj.getString("id"),
                        name = obj.getString("name"),
                        typeLabel = obj.optString("typeLabel", ""),
                        category = obj.optString("category", "creatures"),
                        summary = obj.optString("summary", ""),
                        body = bodyList,
                        region = obj.optString("region", "شبه الجزيرة العربية"),
                        readingTimeMinutes = obj.optInt("readingTimeMinutes", 3),
                        heroImage = obj.optString("heroImage", "")
                    )
                )
            }
        } catch (_: Exception) {
            // Graceful fallback if asset read fails
        }

        // Merge registered premium long-form entries so Library displays all entries offline
        for (longEntry in getLongFormEntries()) {
            if (mythsList.none { it.id == longEntry.id }) {
                mythsList.add(
                    MythModel(
                        id = longEntry.id,
                        name = longEntry.name,
                        typeLabel = longEntry.entryType,
                        category = longEntry.category,
                        summary = longEntry.summary,
                        body = longEntry.body,
                        region = longEntry.region,
                        readingTimeMinutes = (longEntry.targetWords / 180).coerceAtLeast(15),
                        heroImage = longEntry.heroImage,
                        isLongForm = longEntry.isLongForm,
                        isPremium = longEntry.isPremium,
                        isHistorical = longEntry.isHistorical,
                        entryType = longEntry.entryType,
                        evidenceLabels = longEntry.evidenceLabels,
                        targetWords = longEntry.targetWords
                    )
                )
            }
        }

        cachedMyths = mythsList
        return mythsList
    }

    fun getLongFormEntries(): List<LongFormEntry> {
        cachedLongFormEntries?.let { return it }

        val result = mutableListOf<LongFormEntry>()
        try {
            val inputStream = context.assets.open("long_form_entries.json")
            val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
            val jsonString = reader.use { it.readText() }

            val jsonArray = JSONArray(jsonString)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)

                val bodyArray = obj.optJSONArray("body") ?: JSONArray()
                val bodyList = mutableListOf<String>()
                for (j in 0 until bodyArray.length()) {
                    bodyList.add(bodyArray.getString(j))
                }

                val evidenceArray = obj.optJSONArray("evidenceLabels") ?: JSONArray()
                val evidenceList = mutableListOf<String>()
                for (j in 0 until evidenceArray.length()) {
                    evidenceList.add(evidenceArray.getString(j))
                }

                val chaptersArray = obj.optJSONArray("chapters") ?: JSONArray()
                val chaptersList = mutableListOf<LongFormChapter>()
                for (c in 0 until chaptersArray.length()) {
                    val chObj = chaptersArray.getJSONObject(c)
                    val pArray = chObj.optJSONArray("paragraphs") ?: JSONArray()
                    val paragraphs = mutableListOf<String>()
                    for (p in 0 until pArray.length()) {
                        paragraphs.add(pArray.getString(p))
                    }

                    val index = chObj.optInt("index", c)
                    chaptersList.add(
                        LongFormChapter(
                            id = chObj.getString("id"),
                            index = index,
                            title = chObj.getString("title"),
                            evidenceLabel = chObj.optString("evidenceLabel", evidenceList.firstOrNull().orEmpty()),
                            isAppendix = chObj.optBoolean("isAppendix", false),
                            isFree = chObj.optBoolean("isFree", index == 0),
                            estimatedWords = chObj.optInt("estimatedWords", 0),
                            contentPending = chObj.optBoolean("contentPending", paragraphs.isEmpty()),
                            paragraphs = paragraphs
                        )
                    )
                }

                result.add(
                    LongFormEntry(
                        id = obj.getString("id"),
                        name = obj.getString("name"),
                        latinName = obj.optString("latinName", ""),
                        category = obj.optString("category", "شخصيات"),
                        categoryKey = obj.optString("categoryKey", "personalities"),
                        entryType = obj.optString("entryType", obj.optString("typeLabel", "")),
                        isLongForm = obj.optBoolean("isLongForm", true),
                        isPremium = obj.optBoolean("isPremium", true),
                        isHistorical = obj.optBoolean("isHistorical", false),
                        requiredSubscription = obj.optString("requiredSubscription", LongFormEntry.PREMIUM_MONTHLY_PRODUCT_ID),
                        heroImage = obj.optString("heroImage", ""),
                        evidenceLabels = evidenceList,
                        targetWords = obj.optInt("targetWords", 0),
                        region = obj.optString("region", ""),
                        approxYear = obj.optInt("approxYear", 0),
                        summary = obj.optString("summary", ""),
                        body = bodyList,
                        chapters = chaptersList
                    )
                )
            }
        } catch (_: Exception) {
            // Graceful fallback if long_form_entries.json is missing
        }

        cachedLongFormEntries = result
        return result
    }

    fun getLongFormEntryById(id: String): LongFormEntry? {
        return getLongFormEntries().find { it.id == id }
    }

    fun getMythById(id: String): MythModel? {
        return getMyths().find { it.id == id }
    }
}
