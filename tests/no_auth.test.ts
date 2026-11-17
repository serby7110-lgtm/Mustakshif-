import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function collectFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.git') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

test('No Authentication, Google Sign-In, or OAuth remains anywhere in Web or Android sources', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'src/context/AuthContext.tsx')), false, 'AuthContext.tsx must be deleted');
  assert.equal(fs.existsSync(path.join(ROOT, 'src/services/calendar.ts')), false, 'calendar.ts must be deleted');
  assert.equal(fs.existsSync(path.join(ROOT, 'src/services/gmail.ts')), false, 'gmail.ts must be deleted');

  const webFiles = collectFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']);
  const androidFiles = collectFiles(path.join(ROOT, 'app/src'), ['.kt', '.java', '.xml']);
  const gradleFiles = [path.join(ROOT, 'app/build.gradle.kts'), path.join(ROOT, 'build.gradle.kts')];

  const forbiddenPatterns = [
    /firebase\/auth/,
    /firebase-auth/,
    /FirebaseAuth/,
    /GoogleAuthProvider/,
    /GoogleSignIn/,
    /play-services-auth/,
    /signInWithPopup/,
    /onAuthStateChanged/,
    /AuthProvider/,
    /useAuth/,
    /WORKSPACE_SCOPES/,
    /CredentialManager/,
    /تسجيل الدخول عبر Google/,
    /يرجى تسجيل الدخول/,
  ];

  for (const file of [...webFiles, ...androidFiles, ...gradleFiles]) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(content, pattern, `Forbidden auth pattern ${pattern} found in ${rel}`);
    }
  }
});

test('Android keeps Firebase Analytics, Crashlytics, Remote Config, and FCM while using Google Play Billing queryPurchasesAsync', () => {
  const gradle = fs.readFileSync(path.join(ROOT, 'app/build.gradle.kts'), 'utf8');
  assert.match(gradle, /com\.google\.firebase:firebase-analytics/);
  assert.match(gradle, /com\.google\.firebase:firebase-crashlytics/);
  assert.match(gradle, /com\.google\.firebase:firebase-config/);
  assert.match(gradle, /com\.google\.firebase:firebase-messaging/);
  assert.match(gradle, /com\.android\.billingclient:billing-ktx/);
  assert.doesNotMatch(gradle, /firebase-auth/);

  const entitlement = fs.readFileSync(
    path.join(ROOT, 'app/src/main/java/com/mustakshif/app/data/EntitlementManager.kt'),
    'utf8'
  );
  assert.match(entitlement, /BillingClient/);
  assert.match(entitlement, /queryPurchasesAsync/);
  assert.match(entitlement, /BillingClient\.ProductType\.SUBS/);
  assert.match(entitlement, /PRODUCT_PREMIUM_MONTHLY/);
  assert.match(entitlement, /acknowledgePurchase/);
  assert.doesNotMatch(entitlement, /setPremiumMonthlyActive/);

  const mainKt = fs.readFileSync(
    path.join(ROOT, 'app/src/main/java/com/mustakshif/app/MainActivity.kt'),
    'utf8'
  );
  assert.match(mainKt, /EntitlementManager\.init\(this\)/);
  assert.match(mainKt, /EntitlementManager\.refreshEntitlements\(this\)/);
});

test('Bookmarks, reading progress, badges, and settings stay in local storage (Web localStorage & Android Room/DataStore)', () => {
  const storageTs = fs.readFileSync(path.join(ROOT, 'src/data/storage.ts'), 'utf8');
  assert.match(storageTs, /getBookmarks/);
  assert.match(storageTs, /getAllMythProgress/);
  assert.match(storageTs, /getFavoriteHooks/);
  assert.match(storageTs, /getThemeMode/);
  assert.match(storageTs, /getFontSize/);
  assert.match(storageTs, /localStorage/);

  const gradle = fs.readFileSync(path.join(ROOT, 'app/build.gradle.kts'), 'utf8');
  assert.match(gradle, /androidx\.room:room-ktx/);
  assert.match(gradle, /androidx\.datastore:datastore-preferences/);

  const progressStore = fs.readFileSync(
    path.join(ROOT, 'app/src/main/java/com/mustakshif/app/storage/LongFormProgressStore.kt'),
    'utf8'
  );
  assert.match(progressStore, /getSharedPreferences/);
  assert.match(progressStore, /recordChapterProgress/);
});
