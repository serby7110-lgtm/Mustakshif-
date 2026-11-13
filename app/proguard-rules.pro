# ProGuard / R8 Rules for Mustakshif Native Android App (API 21+)
# Ensures release optimizations do not strip essential classes, models, or reflection metadata.

# 1. Android TextToSpeech (TTS)
-keep class android.speech.tts.** { *; }
-keep class com.mustakshif.app.tts.** { *; }
-keepclassmembers class * implements android.speech.tts.TextToSpeech$OnInitListener {
    public void onInit(int);
}
-keepclassmembers class * extends android.speech.tts.UtteranceProgressListener {
    public <methods>;
}

# 2. Room Architecture Components & SQLite
-keep class androidx.room.** { *; }
-dontwarn androidx.room.paging.**
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Dao interface * { *; }
-keep @androidx.room.Entity class * { *; }
-keepclassmembers class * {
    @androidx.room.Database <methods>;
    @androidx.room.Dao <methods>;
}
-keep class androidx.sqlite.db.** { *; }

# 3. Data Models & Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses, Signature, EnclosingMethod
-keep @kotlinx.serialization.Serializable class * { *; }
-keepclassmembers class * {
    *** Companion;
}
-keepclassmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep class kotlinx.serialization.** { *; }
-keep class com.mustakshif.app.data.** { *; }
-keep class com.mustakshif.app.storage.** { *; }

# 4. Java 8+ Desugaring API rules (coreLibraryDesugaring)
-dontwarn java.time.**
-dontwarn j$.**
-keep class j$.** { *; }

# 5. Jetpack Compose & Material 3
-keep class androidx.compose.material3.** { *; }
-keep class androidx.compose.ui.** { *; }
-keep class com.mustakshif.app.theme.** { *; }
-dontwarn androidx.compose.**

# 6. Coroutines & Flow
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# 7. Notifications & Android 13+ Compat
-keep class com.mustakshif.app.notifications.** { *; }

# 8. Google Mobile Ads (AdMob) & User Messaging Platform (UMP)
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.identifier.** { *; }
-keep class com.google.ads.** { *; }
-keep class com.google.android.ump.** { *; }
-keep class com.mustakshif.app.ads.** { *; }
-keep class com.mustakshif.app.MustakshifApplication { *; }
-keep class com.mustakshif.app.MainActivity { *; }
-keep class com.mustakshif.app.BuildConfig { *; }
-dontwarn com.google.android.gms.ads.**
-dontwarn com.google.android.ump.**

# 9. Firebase Analytics, Crashlytics, Remote Config & Messaging
-keep class com.mustakshif.app.firebase.** { *; }
-keep class com.google.firebase.FirebaseApp { *; }
-keep class com.google.firebase.FirebaseOptions { *; }
-keep class com.google.firebase.analytics.** { *; }
-keep class com.google.firebase.crashlytics.** { *; }
-keep class com.google.firebase.remoteconfig.** { *; }
-keep class com.google.firebase.messaging.** { *; }
-keep class com.google.android.gms.measurement.** { *; }
-keep class com.google.android.gms.common.GoogleApiAvailability { *; }
-keep class androidx.lifecycle.ProcessLifecycleOwner { *; }
-keep class * implements androidx.lifecycle.DefaultLifecycleObserver { *; }
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keep public class * extends java.lang.Exception
