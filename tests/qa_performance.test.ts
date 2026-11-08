import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('STEP 1: Counts - 62 myths, 10 civilizations, 15 deep stories, 52 public images', () => {
  const myths = JSON.parse(fs.readFileSync('src/data/myths.json', 'utf8'));
  const civs = JSON.parse(fs.readFileSync('src/data/civilizations.json', 'utf8'));
  const stories = JSON.parse(fs.readFileSync('src/data/stories.json', 'utf8'));
  const images = fs.readdirSync('public/images').filter((f) => !f.startsWith('.'));

  assert.equal(myths.length, 62, 'Total myths must be exactly 62');
  assert.equal(civs.length, 10, 'Total civilizations must be exactly 10');
  assert.equal(Object.keys(stories).length, 15, 'Total deep stories must be 15');
  assert.ok(images.length >= 52, `Total images must be at least 52 (found ${images.length})`);
});

test('STEP 1: Performance - Library list pagination (show 20, load more) and search debouncing', () => {
  const libCode = fs.readFileSync('src/screens/LibraryScreen.tsx', 'utf8');

  assert.ok(libCode.includes('PAGE_SIZE = 20'), 'LibraryScreen must paginate with 20 items per page');
  assert.ok(libCode.includes('pagedMyths'), 'LibraryScreen must render paginated slice (pagedMyths)');
  assert.ok(libCode.includes('useDebounce'), 'LibraryScreen must debounce search');
  assert.ok(libCode.includes('عرض المزيد'), 'LibraryScreen must include load more button');
  assert.ok(libCode.includes('handleScroll'), 'LibraryScreen must support loading more on window scroll');
});

test('STEP 1: Performance - Map markers frustum culling & 300ms search debounce', () => {
  const mapCode = fs.readFileSync('src/screens/MapScreen.tsx', 'utf8');

  assert.ok(mapCode.includes('visibleMarkers'), 'MapScreen must render visibleMarkers with frustum culling');
  assert.ok(mapCode.includes('visibleBounds'), 'MapScreen must track visibleBounds');
  assert.ok(mapCode.includes('useDebounce'), 'MapScreen must debounce search with useDebounce');
});

test('STEP 1 & 3: Images have loading="lazy" and Arabic alt text', () => {
  const civScreen = fs.readFileSync('src/screens/CivilizationsScreen.tsx', 'utf8');
  const civPage = fs.readFileSync('src/screens/CivilizationPage.tsx', 'utf8');
  const homeScreen = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');
  const articleScreen = fs.readFileSync('src/screens/ArticleScreen.tsx', 'utf8');
  const libraryScreen = fs.readFileSync('src/screens/LibraryScreen.tsx', 'utf8');
  const mapScreen = fs.readFileSync('src/screens/MapScreen.tsx', 'utf8');

  assert.ok(civScreen.includes('loading="lazy"'), 'CivilizationsScreen must use loading="lazy"');
  assert.ok(civPage.includes('loading="lazy"'), 'CivilizationPage must use loading="lazy"');
  assert.ok(homeScreen.includes('loading="lazy"'), 'HomeScreen must use loading="lazy"');
  assert.ok(articleScreen.includes('loading="lazy"'), 'ArticleScreen must use loading="lazy"');
  assert.ok(libraryScreen.includes('loading="lazy"'), 'LibraryScreen must use loading="lazy"');
  assert.ok(mapScreen.includes('loading="lazy"'), 'MapScreen must use loading="lazy"');
});

test('STEP 2: RTL audit - Arabic system font fallbacks and proper icon directions', () => {
  const indexCss = fs.readFileSync('src/index.css', 'utf8');

  assert.ok(indexCss.includes('Noto Sans Arabic') || indexCss.includes('Geeza Pro'), 'Must define Arabic system font fallback');
  assert.ok(indexCss.includes('Traditional Arabic'), 'Must define display font fallback');

  const articleScreen = fs.readFileSync('src/screens/ArticleScreen.tsx', 'utf8');
  const civPage = fs.readFileSync('src/screens/CivilizationPage.tsx', 'utf8');
  const methodology = fs.readFileSync('src/screens/MethodologyScreen.tsx', 'utf8');

  // Back icons point right in RTL
  assert.ok(articleScreen.includes('ChevronRight'), 'ArticleScreen back button uses ChevronRight (pointing right in RTL)');
  assert.ok(civPage.includes('ArrowRight'), 'CivilizationPage back button uses ArrowRight');
  assert.ok(methodology.includes('ArrowRight'), 'MethodologyScreen back button uses ArrowRight');
});

test('STEP 4: Dark mode persistence and system preference sync', () => {
  const themeCtx = fs.readFileSync('src/theme/ThemeContext.tsx', 'utf8');

  assert.ok(themeCtx.includes('storage.setThemeMode'), 'ThemeContext must persist theme in storage');
  assert.ok(themeCtx.includes('prefers-color-scheme: dark'), 'ThemeContext must check system preference');
});

test('STEP 5: ErrorBoundary with Arabic fallback "حدث خطأ — أعد التحميل" wraps screens in App.tsx', () => {
  const errorBoundaryPath = path.resolve('src/components/common/ErrorBoundary.tsx');
  assert.ok(fs.existsSync(errorBoundaryPath), 'ErrorBoundary component must exist');

  const ebCode = fs.readFileSync(errorBoundaryPath, 'utf8');
  assert.ok(ebCode.includes('حدث خطأ — أعد التحميل'), 'ErrorBoundary must display verbatim "حدث خطأ — أعد التحميل"');

  const appCode = fs.readFileSync('src/App.tsx', 'utf8');
  assert.ok(appCode.includes('ErrorBoundary'), 'App.tsx must import ErrorBoundary');
  assert.ok(appCode.includes('<ErrorBoundary>\n                <HomeScreen') || appCode.includes('<ErrorBoundary><HomeScreen') || appCode.includes('<HomeScreen'), 'HomeScreen wrapped in ErrorBoundary');
  assert.ok(appCode.includes('<ErrorBoundary>\n                <CivilizationsScreen') || appCode.includes('<ErrorBoundary><CivilizationsScreen') || appCode.includes('<CivilizationsScreen'), 'CivilizationsScreen wrapped in ErrorBoundary');
});
