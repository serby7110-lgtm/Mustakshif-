import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getAllEntries, getEntriesByCategory, getEntryById } from '../src/data/seed';
import { searchEntries } from '../src/utils/arabicSearch';
import { getEstimatedReadingTime } from '../src/utils/readingTime';
import { CATEGORY_LABELS } from '../src/data/types';
import {
  PLAY_SUBSCRIPTIONS_URL,
  SUBSCRIPTION_BENEFITS,
  TIP_PRODUCTS,
} from '../src/services/subscription';

const ROOT = process.cwd();

function read(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Mustakshif v1.4.0 Premium, Subscription & Ads Specification', () => {
  it('1. Category lists, Library, and Search return ALL entries including isPremium=true', () => {
    const personalities = getEntriesByCategory('personalities');
    assert.equal(personalities.length, 8);
    for (const id of ['dhul-qarnayn', 'sinbad', 'ibn-battuta']) {
      const found = personalities.find((e) => e.id === id);
      assert.ok(found, `${id} must be returned by getEntriesByCategory('personalities')`);
      assert.equal(found.isPremium, true);
    }

    const allEntries = getAllEntries();
    assert.ok(allEntries.some((e) => e.id === 'dhul-qarnayn' && e.isPremium));
    assert.ok(allEntries.some((e) => e.id === 'sinbad' && e.isPremium));
    assert.ok(allEntries.some((e) => e.id === 'ibn-battuta' && e.isPremium));

    const searchRes = searchEntries(allEntries, 'بطوطة');
    assert.ok(
      searchRes.some((r) => r.entry.id === 'ibn-battuta' && r.entry.isPremium),
      'Search must return premium entries with isPremium=true'
    );
  });

  it('2. Characters data includes summary, sources[], tags[], and chapters[] for all 3 new entries', () => {
    for (const id of ['dhul-qarnayn', 'sinbad', 'ibn-battuta']) {
      const entry = getEntryById(id);
      assert.ok(entry, `${id} must resolve via getEntryById`);
      assert.equal(entry.category, 'personalities');
      assert.equal(entry.isPremium, true);
      assert.ok(entry.summary.trim().length > 10);
      assert.ok(Array.isArray(entry.sources) && entry.sources.length > 0);
      assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0);
      assert.ok(Array.isArray(entry.chapters) && entry.chapters.length >= 7);
    }
    const ibnBattuta = getEntryById('ibn-battuta');
    assert.equal(ibnBattuta?.isHistorical, true);
  });

  it('3. Locked card state sets 0.55 opacity, 18px stroke 1.9 Lock top-start, and #4A90D9 white Premium pill', () => {
    const webBadges = read('src/components/primitives/LockedMediaBadges.tsx');
    assert.match(webBadges, /0\.55/);
    assert.match(webBadges, /size=\{18\}/);
    assert.match(webBadges, /strokeWidth=\{1\.9\}/);
    assert.match(webBadges, /#4A90D9/);
    assert.match(webBadges, /#FFFFFF/);

    const androidComponents = read('app/src/main/java/com/mustakshif/app/ui/LongFormReaderComponents.kt');
    assert.match(androidComponents, /0\.55f/);
    assert.match(androidComponents, /18\.dp/);
    assert.match(androidComponents, /0xFF4A90D9/);
    assert.match(androidComponents, /Color\.White/);
    assert.match(androidComponents, /MythEntryCard/);
  });

  it('4. Entry access opens detail screen cleanly; Chapter 1 readable, Chapter 2+ paywall card includes benefits, price, subscribe & restore', () => {
    const readerTsx = read('src/components/longform/LongFormReaderSection.tsx');
    assert.match(readerTsx, /SUBSCRIPTION_BENEFITS/);
    assert.match(readerTsx, /اشترك الآن/);
    assert.match(readerTsx, /استعادة المشتريات/);
    assert.match(readerTsx, /paywall_view/);

    const androidComponents = read('app/src/main/java/com/mustakshif/app/ui/LongFormReaderComponents.kt');
    assert.match(androidComponents, /subscription_benefit_stories/);
    assert.match(androidComponents, /subscription_benefit_ads/);
    assert.match(androidComponents, /long_form_unlock_cta/);
    assert.match(androidComponents, /long_form_restore_cta/);
  });

  it('5. Reading time recomputed from body + chapters + quotes at 180 Arabic WPM rounded up (ceil)', () => {
    const mins = getEstimatedReadingTime({
      id: 'test-180wpm',
      name: 'اختبار',
      latinName: 'Test',
      category: 'personalities',
      typeLabel: 'اختبار',
      heroImage: 'images/dhul-qarnayn.jpg',
      summary: 'ملخص',
      body: [new Array(180).fill('كلمة').join(' ')],
      sources: [],
      timeline: [],
      region: 'الجزيرة العربية',
      related: [],
      tags: ['تاريخ'],
      chapters: [
        {
          id: 'ch-1',
          index: 0,
          title: 'الفصل',
          evidenceLabel: 'موثق تاريخياً',
          isAppendix: false,
          isFree: true,
          estimatedWords: 181,
          contentPending: false,
          paragraphs: [new Array(181).fill('نص').join(' ')],
        },
      ],
      quotes: [{ text: new Array(90).fill('حكمة').join(' '), source: 'المصدر' }],
    } as Parameters<typeof getEstimatedReadingTime>[0] & {
      quotes: Array<{ text: string; source: string }>;
    });
    // 180 + 182 (title+paragraphs) + 91 (quote+source) = 453 words -> ceil(453 / 180) = 3 minutes
    assert.equal(mins, 3);

    const repoKt = read('app/src/main/java/com/mustakshif/app/data/MythRepository.kt');
    assert.match(repoKt, /180\.0/);
    assert.match(repoKt, /ceil/);
    assert.match(repoKt, /getDocumentedCount/);
  });

  it('6. Subscription screen ("الاشتراك") supports status, renewal, benefits, Play price/period, activate, restore, manage URL, and tips (tip_1, tip_3, tip_5)', () => {
    assert.equal(
      PLAY_SUBSCRIPTIONS_URL,
      'https://play.google.com/store/account/subscriptions?package=com.sink.mustakshif'
    );
    assert.deepEqual(SUBSCRIPTION_BENEFITS, [
      'فتح كل القصص الطويلة',
      'إزالة كل الإعلانات',
    ]);
    assert.deepEqual(
      TIP_PRODUCTS.map((t) => t.id),
      ['tip_1', 'tip_3', 'tip_5']
    );

    const webSubScreen = read('src/screens/SubscriptionScreen.tsx');
    const webSubService = read('src/services/subscription.ts');
    assert.match(webSubScreen, /#3DDC97/);
    assert.match(webSubScreen, /شحن \/ تفعيل الاشتراك/);
    assert.match(webSubScreen, /استعادة المشتريات/);
    assert.match(webSubScreen, /إدارة الاشتراك \/ الإلغاء/);
    assert.match(webSubService, /تم تفعيل Premium/);

    const androidSubScreen = read('app/src/main/java/com/mustakshif/app/ui/SubscriptionScreen.kt');
    assert.match(androidSubScreen, /0xFF3DDC97/);
    assert.match(androidSubScreen, /launchPurchaseFlow/);
    assert.match(androidSubScreen, /restorePurchases/);
    assert.match(androidSubScreen, /launchTipPurchaseFlow/);
    assert.match(androidSubScreen, /PRODUCT_TIP_1/);
    assert.match(androidSubScreen, /PRODUCT_TIP_3/);
    assert.match(androidSubScreen, /PRODUCT_TIP_5/);

    const profileTsx = read('src/screens/ProfileScreen.tsx');
    assert.match(profileTsx, /الاشتراك/);
    assert.match(profileTsx, /onOpenSubscription/);
  });

  it('7. Home banner appears at top of Home when inactive and switches to "Premium مفعّل ✓" chip when active', () => {
    const homeTsx = read('src/screens/HomeScreen.tsx');
    assert.match(homeTsx, /افتح كل القصص الطويلة وأزل الإعلانات/);
    assert.match(homeTsx, /#E8F1FB/);
    assert.match(homeTsx, /#F2FBF7/);
    assert.match(homeTsx, /#4A90D9/);
    assert.match(homeTsx, /#0E5C4D/);
    assert.match(homeTsx, /Premium مفعّل ✓/);

    const androidComponents = read('app/src/main/java/com/mustakshif/app/ui/LongFormReaderComponents.kt');
    assert.match(androidComponents, /HomePremiumBanner/);
    assert.match(androidComponents, /0xFFE8F1FB/);
    assert.match(androidComponents, /0xFFF2FBF7/);
    assert.match(androidComponents, /0xFF4A90D9/);
    assert.match(androidComponents, /0xFF0E5C4D/);
  });

  it('8. Entitlement uses Play Billing + Jetpack DataStore with 7-day offline grace and suppresses all ads when active', () => {
    const entKt = read('app/src/main/java/com/mustakshif/app/data/EntitlementManager.kt');
    assert.match(entKt, /preferencesDataStore/);
    assert.match(entKt, /OFFLINE_GRACE_PERIOD_MS = 7L \* 24L \* 60L \* 60L \* 1000L/);
    assert.match(entKt, /queryPurchasesAsync/);
    assert.match(entKt, /consumeAsync/);
    assert.match(entKt, /clearLoadedAds\(\)/);
    assert.match(entKt, /خدمة الاشتراك غير متاحة على هذا الجهاز/);

    const adManagerKt = read('app/src/main/java/com/mustakshif/app/ads/AdManager.kt');
    assert.match(adManagerKt, /EntitlementManager\.hasPremiumMonthly\.value/);
    assert.match(adManagerKt, /clearLoadedAds/);
  });

  it('9. Analytics logs all 8 required events on Web & Android', () => {
    const requiredEvents = [
      'premium_banner_view',
      'locked_entry_tap',
      'paywall_view',
      'subscribe_start',
      'subscribe_success',
      'restore_purchases',
      'manage_subscription',
      'tip_purchase',
    ];
    const analyticsKt = read('app/src/main/java/com/mustakshif/app/firebase/AnalyticsManager.kt');
    const firebaseTs = read('src/lib/firebase.ts');
    for (const evt of requiredEvents) {
      assert.ok(analyticsKt.includes(evt), `Android AnalyticsManager missing ${evt}`);
      assert.ok(firebaseTs.includes(evt), `Web firebase.ts missing ${evt}`);
    }
  });

  it('10. Tile colors, category label "ملوك وملكات", and "جزر الواق الواق" typo fix are enforced', () => {
    assert.equal(CATEGORY_LABELS.kings, 'ملوك وملكات');
    const arTs = read('src/i18n/ar.ts');
    assert.match(arTs, /'cat\.kings': 'ملوك وملكات'/);

    const seedTs = read('src/data/seed.ts');
    const oldTypoRe = new RegExp('\\u062c\\u0632\\u0631 \\u0627\\u0644\\u0648\\u0642\\u0648\\u0627\\u0642');
    assert.doesNotMatch(seedTs, oldTypoRe);
    assert.match(seedTs, /جزر الواق الواق/);
  });

  it('11. Android app/build.gradle.kts versionName = "1.4.0" and versionCode = 3', () => {
    const gradle = read('app/build.gradle.kts');
    assert.match(gradle, /versionCode\s*=\s*3/);
    assert.match(gradle, /versionName\s*=\s*"1\.4\.0"/);
  });
});
