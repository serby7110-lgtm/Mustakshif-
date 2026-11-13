package com.mustakshif.app.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.mustakshif.app.MainActivity
import com.mustakshif.app.R

/**
 * Handles Android system notifications with safe version guards for:
 * - Notification Channels (API 26+) including "أسطورة اليوم"
 * - POST_NOTIFICATIONS runtime permission (API 33+)
 * - Deep-linking on notification tap to Article screen for myth_id
 * Fully backwards compatible to API 21 (Android 5.0 Lollipop).
 */
object NotificationHelper {

    const val CHANNEL_READING_REMINDERS = "channel_reading_reminders"
    const val CHANNEL_DAILY_MYTH = "channel_daily_myth"
    const val EXTRA_DEEP_LINK_MYTH_ID = "extra_deep_link_myth_id"

    fun createNotificationChannels(context: Context) {
        // Notification channels are only required and available on Android 8.0 (API 26) and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                    ?: return

            val reminderChannel = NotificationChannel(
                CHANNEL_READING_REMINDERS,
                "تذكيرات القراءة",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "تذكيرات ومواعيد جلسات قراءة الأساطير العربية"
                enableVibration(true)
            }

            val dailyMythChannel = NotificationChannel(
                CHANNEL_DAILY_MYTH,
                context.getString(R.string.notification_channel_daily_myth),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.notification_channel_daily_myth_desc)
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(reminderChannel)
            notificationManager.createNotificationChannel(dailyMythChannel)
        }
    }

    fun canPostNotifications(context: Context): Boolean {
        // Runtime permission POST_NOTIFICATIONS was introduced in Android 13 (API 33)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            // For API 21-32, notifications are allowed by default if app notifications are enabled
            NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }

    fun showDailyMythNotification(
        context: Context,
        mythId: String,
        title: String,
        body: String
    ) {
        if (!canPostNotifications(context)) return
        createNotificationChannels(context)

        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_DEEP_LINK_MYTH_ID, mythId)
        }

        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            mythId.hashCode(),
            tapIntent,
            pendingFlags
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_DAILY_MYTH)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        try {
            NotificationManagerCompat.from(context).notify(mythId.hashCode(), builder.build())
        } catch (_: SecurityException) {
            // Guarded against missing permission on API 33+
        }
    }

    fun showReadingReminder(
        context: Context,
        notificationId: Int,
        title: String,
        content: String
    ) {
        if (!canPostNotifications(context)) return

        createNotificationChannels(context)

        // NotificationCompat works seamlessly on API 21 through 35+
        val builder = NotificationCompat.Builder(context, CHANNEL_READING_REMINDERS)
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(NotificationCompat.BigTextStyle().bigText(content))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (_: SecurityException) {
            // Guarded against missing permission on API 33+
        }
    }
}
