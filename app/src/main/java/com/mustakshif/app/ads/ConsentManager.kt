package com.mustakshif.app.ads

import android.app.Activity
import android.content.Context
import android.preference.PreferenceManager
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.PlayServicesGuard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Handles Google User Messaging Platform (UMP) consent before any ad request or analytics collection.
 * Maps resolved UMP purpose consents directly to FirebaseAnalytics Consent Mode.
 * On consent failure or Play Services unavailability, all ad slots and analytics remain disabled silently.
 */
object ConsentManager {

    private val _canRequestAds = MutableStateFlow(false)
    val canRequestAdsState: StateFlow<Boolean> = _canRequestAds.asStateFlow()

    private val _isPrivacyOptionsRequired = MutableStateFlow(false)
    val isPrivacyOptionsRequired: StateFlow<Boolean> = _isPrivacyOptionsRequired.asStateFlow()

    fun canRequestAds(context: Context): Boolean {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(context)) {
            _canRequestAds.value = false
            return false
        }
        return try {
            val consentInfo = UserMessagingPlatform.getConsentInformation(context)
            val allowed = consentInfo.canRequestAds()
            _canRequestAds.value = allowed
            allowed
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("UMPCanRequestAds", t)
            _canRequestAds.value = false
            false
        }
    }

    /**
     * Requests UMP consent info update, displays the consent form if required,
     * and propagates resolved consent to Firebase Analytics Consent Mode.
     */
    fun gatherConsent(
        activity: Activity,
        onConsentReady: (canRequestAds: Boolean) -> Unit
    ) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) {
            _canRequestAds.value = false
            AnalyticsManager.updateConsent(
                context = activity,
                analyticsStorageGranted = false,
                adStorageGranted = false,
                adUserDataGranted = false,
                adPersonalizationGranted = false
            )
            onConsentReady(false)
            return
        }

        try {
            val consentInfo = UserMessagingPlatform.getConsentInformation(activity)

            // General-audience app: explicitly set tagForUnderAgeOfConsent to false
            val params = ConsentRequestParameters.Builder()
                .setTagForUnderAgeOfConsent(false)
                .build()

            consentInfo.requestConsentInfoUpdate(
                activity,
                params,
                {
                    try {
                        UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                            if (formError != null) {
                                CrashlyticsHelper.logAdBreadcrumb("UMP form warning: ${formError.message}")
                            }
                            val allowed = safeCanRequestAds(consentInfo)
                            updatePrivacyOptionsFlag(consentInfo)
                            syncFirebaseConsentMode(activity, allowed)
                            if (!allowed) {
                                AdManager.clearLoadedAds()
                            }
                            _canRequestAds.value = allowed
                            onConsentReady(allowed)
                        }
                    } catch (t: Throwable) {
                        CrashlyticsHelper.recordNonFatal("UMPShowForm", t)
                        val allowed = safeCanRequestAds(consentInfo)
                        syncFirebaseConsentMode(activity, allowed)
                        if (!allowed) {
                            AdManager.clearLoadedAds()
                        }
                        _canRequestAds.value = allowed
                        onConsentReady(allowed)
                    }
                },
                { formError ->
                    CrashlyticsHelper.logAdBreadcrumb("UMP update failed: ${formError.message}")
                    val allowed = safeCanRequestAds(consentInfo)
                    syncFirebaseConsentMode(activity, allowed)
                    if (!allowed) {
                        AdManager.clearLoadedAds()
                    }
                    _canRequestAds.value = allowed
                    onConsentReady(allowed)
                }
            )
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("UMPGatherConsent", t)
            syncFirebaseConsentMode(activity, false)
            AdManager.clearLoadedAds()
            _canRequestAds.value = false
            onConsentReady(false)
        }
    }

    fun showPrivacyOptionsForm(activity: Activity) {
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) return
        try {
            UserMessagingPlatform.showPrivacyOptionsForm(activity) { _ ->
                val consentInfo = UserMessagingPlatform.getConsentInformation(activity)
                updatePrivacyOptionsFlag(consentInfo)
                val allowed = canRequestAds(activity)
                syncFirebaseConsentMode(activity, allowed)
                if (allowed) {
                    AdManager.onConsentGranted(activity)
                } else {
                    AdManager.clearLoadedAds()
                }
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("UMPPrivacyForm", t)
        }
    }

    /**
     * Maps UMP & IAB TCF v2 purpose consents to FirebaseAnalytics.setConsent().
     * If consent is denied, both ads and analytics collection remain DENIED.
     */
    @Suppress("DEPRECATION")
    private fun syncFirebaseConsentMode(context: Context, canRequestAds: Boolean) {
        if (!canRequestAds) {
            AnalyticsManager.updateConsent(
                context = context,
                analyticsStorageGranted = false,
                adStorageGranted = false,
                adUserDataGranted = false,
                adPersonalizationGranted = false
            )
            return
        }

        val purposeConsents = try {
            PreferenceManager.getDefaultSharedPreferences(context.applicationContext)
                .getString("IABTCF_PurposeConsents", "")
                .orEmpty()
        } catch (_: Throwable) {
            ""
        }

        if (purposeConsents.isEmpty()) {
            // Non-EEA / no TCF dialog required: UMP granted consent directly
            AnalyticsManager.updateConsent(
                context = context,
                analyticsStorageGranted = true,
                adStorageGranted = true,
                adUserDataGranted = true,
                adPersonalizationGranted = true
            )
            return
        }

        // TCF v2 purpose indices (0-based):
        // 0 -> Purpose 1 (Store/access info -> AD_STORAGE)
        // 2 -> Purpose 3 (Personalized ads profile), 3 -> Purpose 4 (Select personalized ads)
        // 6,7,8 -> Purposes 7, 8, 9 (Measurement -> ANALYTICS_STORAGE)
        val p1Storage = purposeConsents.getOrNull(0) == '1'
        val p3Personalization = purposeConsents.getOrNull(2) == '1'
        val p4SelectPersonalized = purposeConsents.getOrNull(3) == '1'
        val p7MeasureAds = purposeConsents.getOrNull(6) == '1'
        val p8MeasureContent = purposeConsents.getOrNull(7) == '1'
        val p9AudienceResearch = purposeConsents.getOrNull(8) == '1'

        val personalizedAds = p3Personalization && p4SelectPersonalized
        val analyticsGranted = p7MeasureAds || p8MeasureContent || p9AudienceResearch

        AnalyticsManager.updateConsent(
            context = context,
            analyticsStorageGranted = analyticsGranted,
            adStorageGranted = p1Storage,
            adUserDataGranted = p1Storage && personalizedAds,
            adPersonalizationGranted = personalizedAds
        )
    }

    private fun safeCanRequestAds(consentInfo: ConsentInformation): Boolean {
        return try {
            consentInfo.canRequestAds()
        } catch (_: Throwable) {
            false
        }
    }

    private fun updatePrivacyOptionsFlag(consentInfo: ConsentInformation) {
        _isPrivacyOptionsRequired.value = try {
            consentInfo.privacyOptionsRequirementStatus ==
                ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
        } catch (_: Throwable) {
            false
        }
    }
}
