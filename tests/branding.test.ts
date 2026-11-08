import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Branding: favicon.svg exists and defines the Rub el Hizb geometric star', () => {
  const faviconPath = path.resolve('public', 'favicon.svg');
  assert.ok(fs.existsSync(faviconPath), 'public/favicon.svg must exist');

  const content = fs.readFileSync(faviconPath, 'utf8');
  assert.ok(content.includes('viewBox="0 0 100 100"'), 'Must have 100x100 viewBox');
  assert.ok(content.includes('#0E5C4D'), 'Must contain deep teal #0E5C4D');
  assert.ok(content.includes('#7FD1AE'), 'Must contain mint green #7FD1AE');
  assert.ok(content.includes('#4A90D9'), 'Must contain cool blue #4A90D9');
  assert.ok(content.includes('rotate(45 50 50)'), 'Must contain 45-degree rotated square for 8-pointed star');
});

test('Branding: index.html links to favicon.svg and defines app icons', () => {
  const htmlPath = path.resolve('index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(
    htmlContent.includes('rel="icon" type="image/svg+xml" href="/icons/icon.svg"') ||
    htmlContent.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"'),
    'Must link SVG icon'
  );
  assert.ok(
    htmlContent.includes('rel="apple-touch-icon" href="/icons/icon.svg"') ||
    htmlContent.includes('rel="apple-touch-icon" href="/favicon.svg"'),
    'Must link apple-touch-icon'
  );
  assert.ok(htmlContent.includes('مستكشف'), 'Title must be مستكشف');
});

test('Branding: Logo component file exports Rub el Hizb star with expected palette defaults', () => {
  const logoCodePath = path.resolve('src', 'components', 'primitives', 'Logo.tsx');
  assert.ok(fs.existsSync(logoCodePath), 'Logo.tsx must exist');

  const content = fs.readFileSync(logoCodePath, 'utf8');
  assert.ok(content.includes('#0E5C4D'), 'Default primary color must be deep teal #0E5C4D');
  assert.ok(content.includes('#7FD1AE'), 'Default secondary color must be mint #7FD1AE');
  assert.ok(content.includes('#4A90D9'), 'Default center sparkle color must be cool blue #4A90D9');
  assert.ok(content.includes('rotate(45 50 50)'), 'Must render rotated square');
});

test('Branding: SplashScreen component exists and defaults to ~1.5s duration', () => {
  const splashPath = path.resolve('src', 'screens', 'SplashScreen.tsx');
  assert.ok(fs.existsSync(splashPath), 'SplashScreen.tsx must exist');

  const content = fs.readFileSync(splashPath, 'utf8');
  assert.ok(content.includes('durationMs = 1500'), 'Duration must default to 1500ms (~1.5s)');
  assert.ok(content.includes('مستكشف'), 'Must display app name مستكشف');
  assert.ok(content.includes('موسوعة الأساطير'), 'Must display tagline');
  assert.ok(content.includes('dir="rtl"'), 'Must be fully RTL');
});

test('Onboarding: 3-slide RTL intro contains exact verbatim copies and buttons', () => {
  const onboardingPath = path.resolve('src', 'screens', 'OnboardingScreen.tsx');
  assert.ok(fs.existsSync(onboardingPath), 'OnboardingScreen.tsx must exist');

  const content = fs.readFileSync(onboardingPath, 'utf8');
  assert.ok(content.includes('dir="rtl"'), 'Must be fully RTL');

  // Exact verbatim buttons
  assert.ok(content.includes('ابدأ الرحلة'), 'Must include button: ابدأ الرحلة');
  assert.ok(content.includes('#7FD1AE'), 'Button must be styled with primary mint #7FD1AE');
  assert.ok(content.includes('تخطَّ') || content.includes('ar.onboarding.skip'), 'Must include skip button');

  // Swipe support
  assert.ok(content.includes('onTouchStart') && content.includes('onTouchEnd'), 'Must support touch swipe gestures');

  // Star motif illustration
  assert.ok(content.includes('<Logo'), 'Must use Logo star motif for illustration placeholder');

  // Exact verbatim copies in ar.ts
  const arPath = path.resolve('src', 'i18n', 'ar.ts');
  const arContent = fs.readFileSync(arPath, 'utf8');
  assert.ok(arContent.includes('اكتشف أساطير العرب'), 'Slide 1 Title');
  assert.ok(arContent.includes('رحلة بين الآلهة القديمة والكائنات الخرافية والأماكن المفقودة، في موسوعة عربية تفاعلية.'), 'Slide 1 Body');
  assert.ok(arContent.includes('قصص تُروى ولا تُنسى'), 'Slide 2 Title');
  assert.ok(arContent.includes('خمسون أسطورة موثقة بالمصادر القديمة، مكتوبة بأسلوب الحكواتي ومصحوبة بخط زمني لكل حكاية.'), 'Slide 2 Body');
  assert.ok(arContent.includes('خريطة الأساطير'), 'Slide 3 Title');
  assert.ok(arContent.includes('تتبّع مواضع الأساطير على خريطة العالم العربي، واحفظ ما يعجبك في مكتبتك الخاصة.'), 'Slide 3 Body');
});

test('Navigation: Loop-safe navigation stack in App.tsx', () => {
  const appPath = path.resolve('src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  assert.ok(appContent.includes('entryStack'), 'App.tsx must maintain an entryStack for back navigation');
  assert.ok(appContent.includes('handleSelectRelated'), 'App.tsx must handle related navigation');
  assert.ok(appContent.includes('handleBackFromArticle'), 'App.tsx must pop stack on back from article');
});

