import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Gradle: keeps minSdk 21, AdMob & UMP & lifecycle-process, debug test IDs & real release IDs for 3 formats only', () => {
  const gradle = fs.readFileSync(path.resolve('app/build.gradle.kts'), 'utf8');
  assert.ok(gradle.includes('minSdk = 21'), 'minSdk must remain 21');
  assert.ok(gradle.includes('implementation("com.google.android.gms:play-services-ads:23.6.0")'), 'Must include play-services-ads 23.6.0');
  assert.ok(gradle.includes('implementation("com.google.android.ump:user-messaging-platform:3.1.0")'), 'Must include UMP 3.1.0');
  assert.ok(gradle.includes('implementation("androidx.lifecycle:lifecycle-process:2.8.7")'), 'Must include lifecycle-process for ProcessLifecycleOwner');
  assert.ok(gradle.includes('buildConfig = true'), 'Must enable buildConfig');

  // Official Google Test IDs in debug (Banner, Interstitial, App Open ONLY)
  assert.ok(gradle.includes('ca-app-pub-3940256099942544~3347511713'), 'Debug App ID must be Google test ID');
  assert.ok(gradle.includes('ca-app-pub-3940256099942544/6300978111'), 'Debug Banner ID must be Google test ID');
  assert.ok(gradle.includes('ca-app-pub-3940256099942544/1033173712'), 'Debug Interstitial ID must be Google test ID');
  assert.ok(gradle.includes('ca-app-pub-3940256099942544/9257395921'), 'Debug App Open ID must be Google test ID');

  // Real Release AdMob IDs (Banner, Interstitial, App Open ONLY)
  assert.ok(gradle.includes('ca-app-pub-8269948411498174~6478168963'), 'Real Release App ID');
  assert.ok(gradle.includes('ca-app-pub-8269948411498174/4637493742'), 'Real Release Banner ID');
  assert.ok(gradle.includes('ca-app-pub-8269948411498174/4067803050'), 'Real Release Interstitial ID');
  assert.ok(gradle.includes('ca-app-pub-8269948411498174/9639518924'), 'Real Release App Open ID');

  // Strictly NO Native or Rewarded IDs
  assert.ok(!gradle.includes('ADMOB_NATIVE_ID'), 'Must NOT declare ADMOB_NATIVE_ID');
  assert.ok(!gradle.includes('ADMOB_REWARDED_ID'), 'Must NOT declare ADMOB_REWARDED_ID');
});

test('2. AndroidManifest: INTERNET permission, AdMob APPLICATION_ID, supportsRtl=true, MustakshifApplication', () => {
  const manifest = fs.readFileSync(path.resolve('app/src/main/AndroidManifest.xml'), 'utf8');
  assert.ok(manifest.includes('android.permission.INTERNET'), 'INTERNET permission required');
  assert.ok(manifest.includes('android:supportsRtl="true"'), 'supportsRtl must remain true');
  assert.ok(manifest.includes('android:name=".MustakshifApplication"'), 'Must register MustakshifApplication');
  assert.ok(manifest.includes('com.google.android.gms.ads.APPLICATION_ID'), 'Must declare AdMob APPLICATION_ID meta-data');
  assert.ok(manifest.includes('${admobAppId}'), 'Must inject AdMob App ID via manifestPlaceholder');
});

test('3. MustakshifApplication: initializes MobileAds (T rating, non-child) and ProcessLifecycleOwner >30s return', () => {
  const appKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/MustakshifApplication.kt'), 'utf8');
  assert.ok(appKt.includes('MobileAds.initialize(this)'), 'Calls MobileAds.initialize');
  assert.ok(appKt.includes('MAX_AD_CONTENT_RATING_T'), 'Sets MaxAdContentRating.T (NOT G)');
  assert.ok(appKt.includes('TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE'), 'Child directed must be FALSE');
  assert.ok(appKt.includes('TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE'), 'Under age of consent must be FALSE');
  assert.ok(appKt.includes('setTestDeviceIds'), 'Configures test device IDs for debug');
  assert.ok(!appKt.includes('TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE'), 'Must NOT set child-directed TRUE');
  assert.ok(!appKt.includes('MAX_AD_CONTENT_RATING_G'), 'Must NOT set rating G');
  assert.ok(appKt.includes('ProcessLifecycleOwner.get().lifecycle.addObserver(this)'), 'Uses ProcessLifecycleOwner');
  assert.ok(appKt.includes('APP_OPEN_BACKGROUND_THRESHOLD_MS'), 'Checks >30s background duration before App Open');
});

test('4. ConsentManager: UMP requestConsentInfoUpdate + loadAndShowConsentFormIfRequired before ads', () => {
  const consentKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/ConsentManager.kt'), 'utf8');
  assert.ok(consentKt.includes('requestConsentInfoUpdate'), 'Calls requestConsentInfoUpdate');
  assert.ok(consentKt.includes('loadAndShowConsentFormIfRequired'), 'Calls loadAndShowConsentFormIfRequired');
  assert.ok(consentKt.includes('canRequestAds()'), 'Checks canRequestAds()');
  assert.ok(consentKt.includes('setTagForUnderAgeOfConsent(false)'), 'Sets under age of consent to false');
  assert.ok(consentKt.includes('catch (_: Throwable)'), 'Fails silently without crashing');
});

test('5. AdManager & Placements: Strictly Banner, Interstitial (90s + 60s post-AppOpen), App Open (5s timeout, branded overlay)', () => {
  const configKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/AdConfig.kt'), 'utf8');
  const rcDefaults = fs.readFileSync(path.resolve('app/src/main/res/xml/remote_config_defaults.xml'), 'utf8');
  assert.ok(configKt.includes('interstitialCooldownMs') && rcDefaults.includes('<value>90</value>'), '90-second interstitial frequency cap');
  assert.ok(configKt.includes('APP_OPEN_BACKGROUND_THRESHOLD_MS = 30_000L'), '30-second App Open background threshold');
  assert.ok(configKt.includes('APP_OPEN_TIMEOUT_MS = 5_000L'), '5-second App Open loading timeout');
  assert.ok(configKt.includes('INTERSTITIAL_AFTER_APP_OPEN_COOLDOWN_MS = 60_000L'), '60-second interstitial cooldown after App Open');
  assert.ok(configKt.includes('AppScreen.HOME') && configKt.includes('AppScreen.LIBRARY') && configKt.includes('AppScreen.STUDIO'), 'Banner allowed on Home, Library, Studio');
  assert.ok(!configKt.includes('BANNER_ALLOWED_SCREENS = setOf(\n        AppScreen.ARTICLE'), 'Article must never be in banner allowed screens');
  assert.ok(!configKt.includes('nativeUnitId') && !configKt.includes('rewardedUnitId'), 'No Native or Rewarded in AdConfig');

  const managerKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/AdManager.kt'), 'utf8');
  assert.ok(managerKt.includes('canShowBanner'), 'Enforces banner screen gating');
  assert.ok(managerKt.includes('onArticleReadingProgress'), 'Enforces interstitial completion/90s rules');
  assert.ok(managerKt.includes('INTERSTITIAL_AFTER_APP_OPEN_COOLDOWN_MS'), 'Enforces 60s cooldown after App Open');
  assert.ok(managerKt.includes('isBackNavigation'), 'Prevents interstitial on back-navigation loops');
  assert.ok(managerKt.includes('isFirstEverLaunch'), 'Prevents interstitial & app-open on first-ever launch');
  assert.ok(managerKt.includes('isShowingInterstitial') && managerKt.includes('lastCompletedArticleId'), 'Prevents duplicate interstitial triggers');
  assert.ok(managerKt.includes('onAppForegrounded'), 'Handles cold start & >30s foreground return App Open');
  assert.ok(managerKt.includes('isShowingAppOpenOverlay') && managerKt.includes('APP_OPEN_TIMEOUT_MS'), 'Branded loading overlay with 5s timeout');
  assert.ok(!managerKt.includes('NativeAd') && !managerKt.includes('RewardedAd'), 'Strictly zero Native or Rewarded in AdManager');
  assert.ok(managerKt.includes('catch (t: Throwable)'), 'All ad operations wrapped in try/catch');
});

test('6. UI, Branded Overlay, Banner Reserved Height, Arabic Strings, ProGuard & app-ads.txt', () => {
  const stringsXml = fs.readFileSync(path.resolve('app/src/main/res/values/strings.xml'), 'utf8');
  assert.ok(stringsXml.includes('قد يعرض التطبيق إعلانات لدعم استمراريته.'), 'Arabic disclosure note string');
  assert.ok(stringsXml.includes('جارٍ تحضير الموسوعة...'), 'Arabic App Open loading label');
  assert.ok(!stringsXml.includes('ادعم التطبيق بمشاهدة إعلان'), 'No Rewarded UI string');

  const overlayKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/AppOpenLoadingOverlay.kt'), 'utf8');
  assert.ok(overlayKt.includes('R.drawable.ic_star_logo'), 'Branded overlay renders eight-pointed star logo');
  assert.ok(overlayKt.includes('LayoutDirection.Rtl'), 'Branded overlay enforces RTL');

  const bannerKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/BannerAdSlot.kt'), 'utf8');
  assert.ok(!bannerKt.includes('WindowMetrics'), 'Must not use API 30 WindowMetrics unguarded');
  assert.ok(bannerKt.includes('screenWidthDp'), 'Uses API-21-safe screenWidthDp');
  assert.ok(bannerKt.includes('reservedHeightDp'), 'Reserves fixed height while loading');
  assert.ok(bannerKt.includes('if (hasFailed) {\n        return\n    }'), 'Collapses cleanly to 0 height on failure');

  assert.ok(!fs.existsSync(path.resolve('app/src/main/java/com/mustakshif/app/ads/NativeAdCard.kt')), 'NativeAdCard.kt must be removed');
  assert.ok(!fs.existsSync(path.resolve('app/src/main/res/layout/native_ad_card.xml')), 'native_ad_card.xml must be removed');

  const proguard = fs.readFileSync(path.resolve('app/proguard-rules.pro'), 'utf8');
  assert.ok(proguard.includes('com.google.android.gms.ads.**'), 'ProGuard keeps AdMob classes');
  assert.ok(proguard.includes('com.google.android.gms.ads.identifier.**'), 'ProGuard keeps Ads identifier');
  assert.ok(proguard.includes('com.google.android.ump.**'), 'ProGuard keeps UMP classes');
  assert.ok(proguard.includes('com.mustakshif.app.ads.**'), 'ProGuard keeps app ads package');
  assert.ok(proguard.includes('androidx.lifecycle.ProcessLifecycleOwner'), 'ProGuard keeps ProcessLifecycleOwner');

  const appAdsTxt = fs.readFileSync(path.resolve('public/app-ads.txt'), 'utf8').trim();
  assert.equal(appAdsTxt, 'google.com, pub-8269948411498174, DIRECT, f08c47fec0942fa0', 'Exact app-ads.txt line at Firebase Hosting public root');
});
