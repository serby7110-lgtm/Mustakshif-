package com.mustakshif.app.firebase

import android.content.Context
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability

/**
 * Verifies Google Play Services availability silently for API 21+ and legacy devices.
 * Never shows system error dialogs; when unavailable, Firebase and Ads are skipped
 * so Mustakshif runs in full offline reading mode with zero crashes.
 */
object PlayServicesGuard {

    fun isGooglePlayServicesAvailable(context: Context): Boolean {
        return try {
            val status = GoogleApiAvailability.getInstance()
                .isGooglePlayServicesAvailable(context.applicationContext)
            status == ConnectionResult.SUCCESS
        } catch (_: Throwable) {
            false
        }
    }
}
