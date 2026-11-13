import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Gradle: Firebase plugins (4.4.2), BoM 33.7.0 (minSdk 21 safe), real app/google-services.json, no Auth/Firestore/Storage', () => {
  const rootGradle = fs.readFileSync(path.resolve('build.gradle.kts'), 'utf8');
  assert.ok(rootGradle.includes('id("com.google.gms.google-services") version "4.4.2" apply false'), 'Root Gradle declares google-services 4.4.2 apply false');
  assert.ok(rootGradle.includes('id("com.google.firebase.crashlytics") version "3.0.2" apply false'), 'Root Gradle declares crashlytics 3.0.2 apply false');

  const appGradle = fs.readFileSync(path.resolve('app/build.gradle.kts'), 'utf8');
  assert.ok(appGradle.includes('id("com.android.application")'), 'App Gradle applies android application plugin');
  assert.ok(appGradle.includes('id("com.google.gms.google-services")'), 'App Gradle applies google-services');
  assert.ok(appGradle.includes('id("com.google.firebase.crashlytics")'), 'App Gradle applies crashlytics');
  assert.ok(appGradle.includes('applicationId = "com.sink.mustakshif"'), 'applicationId matches google-services.json package_name');
  assert.ok(appGradle.includes('minSdk = 21'), 'minSdk remains 21');
  assert.ok(appGradle.includes('isCoreLibraryDesugaringEnabled = true'), 'Java 8 desugaring enabled');
  assert.ok(appGradle.includes('com.google.firebase:firebase-bom:33.7.0'), 'Uses minSdk-21-safe Firebase BoM 33.7.0');
  assert.ok(appGradle.includes('com.google.firebase:firebase-analytics'), 'Includes firebase-analytics');
  assert.ok(appGradle.includes('com.google.firebase:firebase-crashlytics'), 'Includes firebase-crashlytics');
  assert.ok(appGradle.includes('com.google.firebase:firebase-config'), 'Includes firebase-config');
  assert.ok(appGradle.includes('com.google.firebase:firebase-messaging'), 'Includes firebase-messaging');
  assert.ok(!appGradle.includes('firebase-auth'), 'Must NOT include firebase-auth');
  assert.ok(!appGradle.includes('firebase-firestore'), 'Must NOT include firebase-firestore');
  assert.ok(!appGradle.includes('firebase-storage'), 'Must NOT include firebase-storage');

  // Verify real user-provided google-services.json is placed in app/
  const gsPath = path.resolve('app/google-services.json');
  assert.ok(fs.existsSync(gsPath), 'app/google-services.json must exist');
  const gsJson = JSON.parse(fs.readFileSync(gsPath, 'utf8'));
  assert.equal(gsJson.project_info.project_id, 'mustakshif-490b4');
  assert.equal(gsJson.project_info.project_number, '319935118490');
  assert.equal(gsJson.client[0].client_info.mobilesdk_app_id, '1:319935118490:android:b2c398da15f6f3f17af323');
  assert.equal(gsJson.client[0].client_info.android_client_info.package_name, 'com.sink.mustakshif');
});

test('2. Firebase Analytics: exact 12 custom events, ad_impression, and default params', () => {
  const analytics = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/firebase/AnalyticsManager.kt'), 'utf8');
  const requiredEvents = [
    'screen_view',
    'article_open',
    'article_read_complete',
    'deep_story_chapter_read',
    'search_query',
    'bookmark_toggle',
    'hook_copy',
    'hook_export',
    'map_pin_open',
    'theme_toggle',
    'tts_play',
    'ad_dismissed'
  ];
  for (const ev of requiredEvents) {
    assert.ok(analytics.includes(`"${ev}"`), `Analytics must log ${ev}`);
  }
  assert.ok(!analytics.includes('"reward_earned"'), 'Must NOT log reward_earned');
  assert.ok(analytics.includes('AD_IMPRESSION'), 'Enables AdMob ad_impression logging');
  assert.ok(analytics.includes('putString("app_language", "ar")'), 'Default param app_language="ar"');
  assert.ok(analytics.includes('putInt("min_sdk", 21)'), 'Default param min_sdk=21');
});

test('3. Consent Mode: UMP syncs ANALYTICS_STORAGE, AD_STORAGE, AD_USER_DATA, AD_PERSONALIZATION', () => {
  const analytics = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/firebase/AnalyticsManager.kt'), 'utf8');
  assert.ok(analytics.includes('ConsentType.ANALYTICS_STORAGE'), 'Maps ANALYTICS_STORAGE');
  assert.ok(analytics.includes('ConsentType.AD_STORAGE'), 'Maps AD_STORAGE');
  assert.ok(analytics.includes('ConsentType.AD_USER_DATA'), 'Maps AD_USER_DATA');
  assert.ok(analytics.includes('ConsentType.AD_PERSONALIZATION'), 'Maps AD_PERSONALIZATION');

  const consent = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/ConsentManager.kt'), 'utf8');
  assert.ok(consent.includes('syncFirebaseConsentMode'), 'Syncs UMP consent resolution to Firebase Consent Mode');
  assert.ok(consent.includes('IABTCF_PurposeConsents'), 'Reads UMP TCF purpose consents');
});

test('4. Crashlytics: release-only, custom keys, breadcrumbs, non-fatal reporting', () => {
  const appGradle = fs.readFileSync(path.resolve('app/build.gradle.kts'), 'utf8');
  assert.ok(appGradle.includes('manifestPlaceholders["crashlyticsEnabled"] = true'), 'Crashlytics true in release');
  assert.ok(appGradle.includes('manifestPlaceholders["crashlyticsEnabled"] = false'), 'Crashlytics false in debug');

  const manifest = fs.readFileSync(path.resolve('app/src/main/AndroidManifest.xml'), 'utf8');
  assert.ok(manifest.includes('firebase_crashlytics_collection_enabled'), 'Manifest configures Crashlytics flag');

  const crash = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/firebase/CrashlyticsHelper.kt'), 'utf8');
  assert.ok(crash.includes('setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)'), 'Disables Crashlytics in debug');
  assert.ok(crash.includes('setCustomKey("myth_id"'), 'Sets myth_id custom key');
  assert.ok(crash.includes('setCustomKey("screen"'), 'Sets screen custom key');
  assert.ok(crash.includes('recordException'), 'Records non-fatal exceptions');
});

test('5. Remote Config: defaults XML has exact 10 keys and AdConfig/AdManager read from RemoteConfigManager', () => {
  const defaultsXml = fs.readFileSync(path.resolve('app/src/main/res/xml/remote_config_defaults.xml'), 'utf8');
  const expectedEntries = [
    ['ads_enabled', 'true'],
    ['banner_enabled', 'true'],
    ['interstitial_enabled', 'true'],
    ['interstitial_cap_seconds', '90'],
    ['interstitial_every_n_articles', '2'],
    ['app_open_enabled', 'true'],
    ['tts_enabled', 'true'],
    ['push_enabled', 'false'],
    ['daily_myth_id', 'anqa'],
    ['min_app_version_code', '1']
  ];
  for (const [key, val] of expectedEntries) {
    assert.ok(defaultsXml.includes(`<key>${key}</key>`), `Defaults XML has key ${key}`);
    assert.ok(defaultsXml.includes(`<value>${val}</value>`), `Defaults XML has value ${val} for ${key}`);
  }
  assert.ok(!defaultsXml.includes('native_enabled'), 'Must NOT include native_enabled');
  assert.ok(!defaultsXml.includes('native_interval'), 'Must NOT include native_interval');
  assert.ok(!defaultsXml.includes('rewarded_enabled'), 'Must NOT include rewarded_enabled');

  const adConfig = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/AdConfig.kt'), 'utf8');
  assert.ok(adConfig.includes('RemoteConfigManager.current.'), 'AdConfig reads dynamically from RemoteConfigManager');
});

test('6. FCM & Old-device safety: PlayServicesGuard + API 26/33 guards + Arabic rationale + deep-link', () => {
  const guard = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/firebase/PlayServicesGuard.kt'), 'utf8');
  assert.ok(guard.includes('GoogleApiAvailability.getInstance()'), 'Checks GoogleApiAvailability');
  assert.ok(guard.includes('ConnectionResult.SUCCESS'), 'Verifies ConnectionResult.SUCCESS');

  const appKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/MustakshifApplication.kt'), 'utf8');
  assert.ok(appKt.includes('PlayServicesGuard.isGooglePlayServicesAvailable'), 'Skips Firebase/Ads when Play Services unavailable');

  const notif = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/notifications/NotificationHelper.kt'), 'utf8');
  assert.ok(notif.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.O'), 'NotificationChannel guarded API 26+');
  assert.ok(notif.includes('EXTRA_DEEP_LINK_MYTH_ID'), 'Deep-links to myth_id');

  const strings = fs.readFileSync(path.resolve('app/src/main/res/values/strings.xml'), 'utf8');
  assert.ok(strings.includes('أسطورة اليوم'), 'Channel named in Arabic "أسطورة اليوم"');
  assert.ok(strings.includes('يحتاج تطبيق مستكشف إلى إذن الإشعارات'), 'Arabic notification permission rationale');

  const mainKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/MainActivity.kt'), 'utf8');
  assert.ok(mainKt.includes('Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU'), 'POST_NOTIFICATIONS guarded API 33+');
  assert.ok(mainKt.includes('handleDeepLinkIntent'), 'Handles FCM notification tap deep-link');
  assert.ok(mainKt.includes('LaunchedEffect(remoteConfig.adsEnabled, remoteConfig.appOpenEnabled, remoteConfig.interstitialEnabled)'), 'Clears cached ads if Remote Config disables ads live');
});

test('7. Release QA Pass: Crashlytics mapping upload, ProGuard rules, consent clearing, interstitial step, app-ads.txt, no test crash leftovers', () => {
  const appGradle = fs.readFileSync(path.resolve('app/build.gradle.kts'), 'utf8');
  assert.ok(appGradle.includes('mappingFileUploadEnabled = true'), 'Crashlytics mapping file upload enabled in release');
  assert.ok(appGradle.includes('mappingFileUploadEnabled = false'), 'Crashlytics mapping file upload disabled in debug');

  const proguard = fs.readFileSync(path.resolve('app/proguard-rules.pro'), 'utf8');
  assert.ok(proguard.includes('com.google.firebase.analytics.**'), 'ProGuard keeps Analytics');
  assert.ok(proguard.includes('com.google.firebase.crashlytics.**'), 'ProGuard keeps Crashlytics');
  assert.ok(proguard.includes('com.google.firebase.remoteconfig.**'), 'ProGuard keeps Remote Config');
  assert.ok(proguard.includes('com.google.firebase.messaging.**'), 'ProGuard keeps FCM');
  assert.ok(proguard.includes('com.google.android.gms.common.GoogleApiAvailability'), 'ProGuard keeps PlayServicesGuard dependency');
  assert.ok(proguard.includes('-renamesourcefileattribute SourceFile'), 'Preserves SourceFile for Crashlytics');

  const consent = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/ConsentManager.kt'), 'utf8');
  assert.ok(consent.includes('AdManager.clearLoadedAds()'), 'Clears preloaded ads when UMP consent is denied or revoked');

  const adManager = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/AdManager.kt'), 'utf8');
  assert.ok(adManager.includes('if (completedArticlesCount % step != 0)'), 'Enforces interstitial_every_n_articles cleanly');
  assert.ok(adManager.includes('fun clearLoadedAds()'), 'Provides clearLoadedAds()');

  const appAds = fs.readFileSync(path.resolve('public/app-ads.txt'), 'utf8').trim();
  assert.equal(appAds, 'google.com, pub-8269948411498174, DIRECT, f08c47fec0942fa0', 'app-ads.txt matches exact AdMob publisher line');

  const mainKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/MainActivity.kt'), 'utf8');
  assert.ok(!mainKt.includes('Test Crash'), 'No test crash code remains in MainActivity');
});

test('8. Firebase Hosting Migration: zero Netlify/Cloudflare leftovers, local assets, firebase.json, privacy.html, index.html', () => {
  assert.ok(!fs.existsSync(path.resolve('netlify.toml')), 'netlify.toml must be removed');
  assert.ok(!fs.existsSync(path.resolve('_headers')), '_headers must not exist');
  assert.ok(!fs.existsSync(path.resolve('_redirects')), '_redirects must not exist');

  const manifest = fs.readFileSync(path.resolve('public/manifest.json'), 'utf8');
  assert.ok(!manifest.includes('netlify'), 'public/manifest.json must not reference Netlify');

  const androidMyths = fs.readFileSync(path.resolve('app/src/main/assets/myths.json'), 'utf8');
  assert.ok(!androidMyths.includes('http://') && !androidMyths.includes('https://'), 'Android myths.json must use bundled local assets only');

  const rootHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(!rootHtml.includes('cloudflareinsights'), 'Cloudflare Web Analytics beacon must be removed');

  const firebaseJson = JSON.parse(fs.readFileSync(path.resolve('firebase.json'), 'utf8'));
  assert.equal(firebaseJson.hosting.public, 'public');
  assert.equal(firebaseJson.hosting.cleanUrls, true);
  const appAdsHeader = firebaseJson.hosting.headers.find((h: { source: string }) => h.source === '/app-ads.txt');
  assert.ok(appAdsHeader, 'firebase.json must define headers for /app-ads.txt');
  assert.ok(
    appAdsHeader.headers.some((hdr: { key: string; value: string }) => hdr.key === 'Content-Type' && hdr.value === 'text/plain'),
    'app-ads.txt Content-Type must be text/plain'
  );

  const privacyHtml = fs.readFileSync(path.resolve('public/privacy.html'), 'utf8');
  assert.ok(privacyHtml.includes('dir="rtl"') && privacyHtml.includes('lang="ar"'), 'privacy.html must be Arabic RTL');
  assert.ok(privacyHtml.includes('AdMob') && privacyHtml.includes('UMP'), 'privacy.html discloses AdMob & UMP');
  assert.ok(privacyHtml.includes('Firebase Analytics') && privacyHtml.includes('Firebase Crashlytics'), 'privacy.html discloses Firebase');
  assert.ok(privacyHtml.includes('غير موجه للأطفال'), 'privacy.html clarifies non-child-directed status');
  assert.ok(privacyHtml.includes('13 نوفمبر 2026'), 'privacy.html includes effective date');
  assert.ok(privacyHtml.includes('mailto:'), 'privacy.html includes contact email placeholder');

  const publicIndex = fs.readFileSync(path.resolve('public/index.html'), 'utf8');
  assert.ok(publicIndex.includes('dir="rtl"') && publicIndex.includes('lang="ar"'), 'public/index.html must be Arabic RTL');
  assert.ok(publicIndex.includes('/privacy.html') && publicIndex.includes('/app-ads.txt'), 'public/index.html links privacy.html and app-ads.txt');
  assert.ok(publicIndex.includes('Google Play'), 'public/index.html includes Play Store badge placeholder');
});
