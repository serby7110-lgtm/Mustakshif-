package com.mustakshif.app.tts

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.widget.Toast
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.RemoteConfigManager
import java.util.Locale

/**
 * Native Arabic Text-To-Speech Manager for Mustakshif.
 * Fully compatible with Android API 21 through 35+.
 * Tuned by Remote Config tts_enabled, checks Arabic language availability,
 * logs Analytics tts_play, and reports non-fatal failures to Crashlytics.
 */
class ArabicTtsManager(
    private val context: Context,
    private val onStateChanged: (TtsState) -> Unit = {}
) : TextToSpeech.OnInitListener {

    enum class TtsState {
        IDLE, PLAYING, PAUSED, UNAVAILABLE
    }

    private var textToSpeech: TextToSpeech? = null
    var isAvailable: Boolean = false
        private set

    private var hasShownUnavailableToast = false
    private val arabicLocale = Locale("ar", "SA")

    init {
        if (RemoteConfigManager.current.ttsEnabled) {
            try {
                textToSpeech = TextToSpeech(context.applicationContext, this)
            } catch (t: Throwable) {
                CrashlyticsHelper.recordNonFatal("TTSInit", t)
                markUnavailable()
            }
        } else {
            isAvailable = false
            onStateChanged(TtsState.UNAVAILABLE)
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            try {
                val tts = textToSpeech ?: return
                val availability = tts.isLanguageAvailable(arabicLocale)

                if (availability >= TextToSpeech.LANG_AVAILABLE) {
                    tts.language = arabicLocale
                    tts.setSpeechRate(0.95f)
                    tts.setPitch(1.0f)
                    isAvailable = true

                    tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(utteranceId: String?) {
                            onStateChanged(TtsState.PLAYING)
                        }

                        override fun onDone(utteranceId: String?) {
                            onStateChanged(TtsState.IDLE)
                        }

                        @Deprecated("Deprecated in Java")
                        override fun onError(utteranceId: String?) {
                            onStateChanged(TtsState.IDLE)
                        }

                        override fun onError(utteranceId: String?, errorCode: Int) {
                            CrashlyticsHelper.logAdBreadcrumb("TTS utterance error code: $errorCode")
                            onStateChanged(TtsState.IDLE)
                        }
                    })
                    onStateChanged(TtsState.IDLE)
                } else {
                    markUnavailable()
                }
            } catch (t: Throwable) {
                CrashlyticsHelper.recordNonFatal("TTSOnInit", t)
                markUnavailable()
            }
        } else {
            markUnavailable()
        }
    }

    private fun markUnavailable() {
        isAvailable = false
        onStateChanged(TtsState.UNAVAILABLE)
        showUnavailableToastOnce()
    }

    fun showUnavailableToastOnce() {
        if (!hasShownUnavailableToast) {
            hasShownUnavailableToast = true
            Toast.makeText(
                context,
                "السرد الصوتي غير متاح على هذا الجهاز",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    fun speak(
        text: String,
        utteranceId: String = "myth_narration",
        mythId: String? = null
    ) {
        if (!RemoteConfigManager.current.ttsEnabled || !isAvailable) {
            showUnavailableToastOnce()
            return
        }

        val tts = textToSpeech ?: return

        try {
            if (!mythId.isNullOrBlank()) {
                AnalyticsManager.logTtsPlay(mythId)
            }

            // API 21+ standard speak method with utteranceId
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                val params = Bundle().apply {
                    putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                }
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            } else {
                @Suppress("DEPRECATION")
                val params = HashMap<String, String>().apply {
                    put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                }
                @Suppress("DEPRECATION")
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, params)
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("TTSSpeak", t)
            markUnavailable()
        }
    }

    fun stop() {
        try {
            textToSpeech?.stop()
        } catch (_: Throwable) {
        }
        onStateChanged(TtsState.IDLE)
    }

    fun shutdown() {
        stop()
        try {
            textToSpeech?.shutdown()
        } catch (_: Throwable) {
        }
        textToSpeech = null
    }
}
