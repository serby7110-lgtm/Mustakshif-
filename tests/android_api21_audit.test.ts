import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Arabic TTS: ArabicTtsManager uses TextToSpeech, checks isLanguageAvailable, and handles unavailability', () => {
  const ttsPath = path.resolve('app/src/main/java/com/mustakshif/app/tts/ArabicTtsManager.kt');
  assert.ok(fs.existsSync(ttsPath), 'ArabicTtsManager.kt must exist');

  const content = fs.readFileSync(ttsPath, 'utf8');
  assert.ok(content.includes('android.speech.tts.TextToSpeech'), 'Must import and use Android TextToSpeech');
  assert.ok(content.includes('isLanguageAvailable(arabicLocale)'), 'Must check isLanguageAvailable for Arabic');
  assert.ok(content.includes('السرد الصوتي غير متاح على هذا الجهاز'), 'Must show required Arabic toast message when unavailable');
  assert.ok(content.includes('fun stop()'), 'Must provide stop method');
  assert.ok(content.includes('fun shutdown()'), 'Must provide shutdown method');
});

test('2. NotificationHelper: guards NotificationChannel (API 26+) and POST_NOTIFICATIONS (API 33+)', () => {
  const notifPath = path.resolve('app/src/main/java/com/mustakshif/app/notifications/NotificationHelper.kt');
  assert.ok(fs.existsSync(notifPath), 'NotificationHelper.kt must exist');

  const content = fs.readFileSync(notifPath, 'utf8');
  assert.ok(content.includes('Build.VERSION_CODES.O'), 'Must guard NotificationChannel with API 26+');
  assert.ok(content.includes('Build.VERSION_CODES.TIRAMISU'), 'Must guard POST_NOTIFICATIONS with API 33+');
  assert.ok(content.includes('NotificationCompat.Builder'), 'Must use backwards compatible NotificationCompat');
});

test('3. ThemeManager: guards setForceDark for API 29+ and safely uses AppCompatDelegate', () => {
  const themePath = path.resolve('app/src/main/java/com/mustakshif/app/theme/ThemeManager.kt');
  assert.ok(fs.existsSync(themePath), 'ThemeManager.kt must exist');

  const content = fs.readFileSync(themePath, 'utf8');
  assert.ok(content.includes('Build.VERSION_CODES.Q'), 'Must guard setForceDark with API 29+ check');
  assert.ok(content.includes('AppCompatDelegate.setDefaultNightMode'), 'Must use AppCompatDelegate for night mode');
});

test('4. StorageHelper: guards Scoped Storage MediaStore (API 29+) with safe API 21 fallback', () => {
  const storagePath = path.resolve('app/src/main/java/com/mustakshif/app/storage/StorageHelper.kt');
  assert.ok(fs.existsSync(storagePath), 'StorageHelper.kt must exist');

  const content = fs.readFileSync(storagePath, 'utf8');
  assert.ok(content.includes('Build.VERSION_CODES.Q'), 'Must check for API 29+ for Scoped Storage');
  assert.ok(content.includes('MediaStore.Downloads.EXTERNAL_CONTENT_URI'), 'Uses MediaStore for API 29+');
  assert.ok(content.includes('getExternalFilesDir'), 'Uses getExternalFilesDir safe fallback on API 21');
});

test('5. AndroidManifest: declares <queries> for TTS_SERVICE (API 30+ package visibility)', () => {
  const manifestPath = path.resolve('app/src/main/AndroidManifest.xml');
  const content = fs.readFileSync(manifestPath, 'utf8');

  assert.ok(content.includes('<queries>'), 'Must include <queries> element');
  assert.ok(content.includes('android.intent.action.TTS_SERVICE'), 'Must query TTS_SERVICE');
  assert.ok(content.includes('android:supportsRtl="true"'), 'Must have supportsRtl="true"');
});

test('6. MythRepository: offline-first local data loader reads myths.json asset without network', () => {
  const repoPath = path.resolve('app/src/main/java/com/mustakshif/app/data/MythRepository.kt');
  assert.ok(fs.existsSync(repoPath), 'MythRepository.kt must exist');

  const assetPath = path.resolve('app/src/main/assets/myths.json');
  assert.ok(fs.existsSync(assetPath), 'app/src/main/assets/myths.json must exist');
});

test('7. MainActivity: stops and shuts down TTS on exit', () => {
  const mainPath = path.resolve('app/src/main/java/com/mustakshif/app/MainActivity.kt');
  assert.ok(fs.existsSync(mainPath), 'MainActivity.kt must exist');

  const content = fs.readFileSync(mainPath, 'utf8');
  assert.ok(content.includes('ttsManager?.stop()'), 'Must stop TTS in onStop');
  assert.ok(content.includes('ttsManager?.shutdown()'), 'Must shutdown TTS in onDestroy');
});
