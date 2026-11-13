import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('QA Audit: Gradle minSdk, compileSdk, targetSdk, versioning, desugaring', () => {
  const gradle = fs.readFileSync(path.resolve('app/build.gradle.kts'), 'utf8');
  assert.ok(gradle.includes('minSdk = 21'), 'minSdk must be 21');
  assert.ok(gradle.includes('targetSdk = 35'), 'targetSdk must be 35');
  assert.ok(gradle.includes('compileSdk = 35'), 'compileSdk must be 35');
  assert.ok(gradle.includes('versionCode = 2'), 'versionCode must be 2');
  assert.ok(gradle.includes('versionName = "1.1.0"'), 'versionName must be 1.1.0');
  assert.ok(gradle.includes('isCoreLibraryDesugaringEnabled = true'), 'Desugaring must be enabled');
  assert.ok(gradle.includes('desugar_jdk_libs'), 'desugar_jdk_libs dependency must exist');
  assert.ok(gradle.includes('useSupportLibrary = true'), 'vectorDrawables.useSupportLibrary must be true');
});

test('QA Audit: AndroidManifest.xml RTL, API 35 target, TTS queries', () => {
  const manifest = fs.readFileSync(path.resolve('app/src/main/AndroidManifest.xml'), 'utf8');
  assert.ok(manifest.includes('android:supportsRtl="true"'), 'supportsRtl must be true');
  assert.ok(manifest.includes('android:theme="@style/Theme.Mustakshif"'), 'Uses Theme.Mustakshif');
  assert.ok(manifest.includes('action android:name="android.intent.action.TTS_SERVICE"'), 'Includes TTS package query');
  assert.ok(manifest.includes('POST_NOTIFICATIONS'), 'Declares POST_NOTIFICATIONS for API 33+');
});

test('QA Audit: Proguard keep rules protect TTS, Room, and serialization classes', () => {
  assert.ok(fs.existsSync(path.resolve('app/proguard-rules.pro')), 'proguard-rules.pro must exist');
  const rules = fs.readFileSync(path.resolve('app/proguard-rules.pro'), 'utf8');
  assert.ok(rules.includes('android.speech.tts.**'), 'Keeps TTS classes');
  assert.ok(rules.includes('androidx.room.**'), 'Keeps Room classes');
  assert.ok(rules.includes('kotlinx.serialization.**'), 'Keeps Kotlinx Serialization classes');
  assert.ok(rules.includes('com.mustakshif.app.data.**'), 'Keeps data models');
  assert.ok(rules.includes('j$.**'), 'Keeps desugared java.time classes');
});

test('QA Audit: TTS gracefully handles missing Arabic voice without crashing on API 21', () => {
  const tts = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/tts/ArabicTtsManager.kt'), 'utf8');
  assert.ok(tts.includes('isLanguageAvailable'), 'Checks Arabic availability');
  assert.ok(tts.includes('السرد الصوتي غير متاح على هذا الجهاز'), 'Shows localized Arabic toast');
  assert.ok(tts.includes('LANG_AVAILABLE'), 'Validates LANG_AVAILABLE status');
  assert.ok(tts.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP'), 'API 21 speak method handled cleanly');
});

test('QA Audit: StorageHelper handles Scoped Storage (API 29+) with API 21 fallback', () => {
  const storage = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/storage/StorageHelper.kt'), 'utf8');
  assert.ok(storage.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q'), 'Guards Scoped Storage MediaStore for API 29+');
  assert.ok(storage.includes('getExternalFilesDir'), 'Provides API 21-28 app-specific directory fallback');
});

test('QA Audit: NotificationHelper guards NotificationChannel for API 26+', () => {
  const notif = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/notifications/NotificationHelper.kt'), 'utf8');
  assert.ok(notif.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.O'), 'Guards NotificationChannel API 26+');
});

test('QA Audit: ThemeManager applies DayNight and guards forceDark for API 29+', () => {
  const themeMgr = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/theme/ThemeManager.kt'), 'utf8');
  assert.ok(themeMgr.includes('AppCompatDelegate.setDefaultNightMode'), 'Uses AppCompatDelegate DayNight');
  assert.ok(themeMgr.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q'), 'Guards forceDark with API 29+ check');
});

test('QA Audit: Offline data in assets/myths.json is intact and readable without network', () => {
  assert.ok(fs.existsSync(path.resolve('app/src/main/assets/myths.json')), 'assets/myths.json must exist');
  const jsonContent = fs.readFileSync(path.resolve('app/src/main/assets/myths.json'), 'utf8');
  const data = JSON.parse(jsonContent);
  assert.ok(Array.isArray(data), 'Data is array');
  assert.ok(data.length >= 50, 'Contains 50+ myth entries for offline reading');
});
