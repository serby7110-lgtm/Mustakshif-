package com.mustakshif.app.notifications

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.mustakshif.app.firebase.RemoteConfigManager

/**
 * Optional FCM service active ONLY when Remote Config push_enabled is true.
 * Deep-links tapped notifications directly to the Article screen for payload myth_id.
 */
class MustakshifMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Token used by FCM only when Remote Config push_enabled == true
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        if (!RemoteConfigManager.current.pushEnabled) return

        val mythId = message.data["myth_id"]
            ?.takeIf { it.isNotBlank() }
            ?: RemoteConfigManager.current.dailyMythId

        val title = message.notification?.title
            ?: message.data["title"]
            ?: "أسطورة اليوم"

        val body = message.notification?.body
            ?: message.data["body"]
            ?: "اكتشف حكاية عربية جديدة في موسوعة مستكشف"

        NotificationHelper.showDailyMythNotification(
            context = applicationContext,
            mythId = mythId,
            title = title,
            body = body
        )
    }
}
