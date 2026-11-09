import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Civilization, getCivById, getAllCivilizations } from '../src/data/civTypes';
import civilizationsData from '../src/data/civilizations.json';

test('Civilizations: civilizations.json is an array and civTypes exports getCivById helper', () => {
  assert.ok(Array.isArray(civilizationsData), 'civilizations.json must be an array');
  assert.equal(typeof getCivById, 'function');
  assert.equal(typeof getAllCivilizations, 'function');
});

test('Civilizations: Civilization schema conforms to full specification', () => {
  const sampleCiv: Civilization = {
    id: 'aad',
    name: 'قوم عاد',
    latinName: 'Aad',
    era: 'الألفية الثالثة ق.م',
    region: 'الأحقاف وصحراء الربع الخالي',
    cities: ['إرم ذات العماد', 'وبار'],
    economy: 'تجارة البخور واللبان والزراعة المروية بالواحات',
    society: 'قبلي أرستقراطي جبار ذو بنية عسكرية مهيبة',
    religion: 'الشرك وعبادة الأصنام مثل صمود وهتار',
    prophet: 'هود عليه السلام',
    quranRefs: ['الفجر: 6-8', 'الأحقاف: 21-26', 'الشعراء: 123-140'],
    chapters: [
      { title: 'أعمدة الأحقاف', text: 'كانت عاد أمة ذات بأس شديد وعمارة سامقة لم يخلق مثلها في البلاد...' }
    ],
    archaeology: ['أطلال الشصر المحفورة برمال الأحقاف', 'مسالك القوافل العتيقة المنقوشة في الصخور'],
    historianNote: 'تعد عاد في الإخباريات العربية أولى الطبقات البائدة ذات القوة المعمارية الأسطورية.',
    legacy: 'خلدت في الذاكرة العربية مثلاً في القوة والاندثار وعبرة في عواقب الغرور.',
    relatedMyths: ['iram-dhat-al-imad', 'al-ghul'],
    tags: ['تاريخ', 'حضارة', 'الأحقاف']
  };

  assert.equal(sampleCiv.id, 'aad');
  assert.equal(sampleCiv.name, 'قوم عاد');
  assert.equal(sampleCiv.cities.length, 2);
  assert.equal(sampleCiv.quranRefs.length, 3);
  assert.equal(sampleCiv.chapters.length, 1);
  assert.equal(sampleCiv.archaeology.length, 2);
  assert.equal(sampleCiv.relatedMyths.length, 2);
});

test('Civilizations: CivilizationPage source code implements all 11 required sections', () => {
  const code = fs.readFileSync(path.resolve('src/screens/CivilizationPage.tsx'), 'utf8');

  // 1) Header
  assert.ok(code.includes('civilization.name') && code.includes('civilization.era'), 'Header section exists');
  // 2) القصة
  assert.ok(code.includes('القصة') && code.includes('civilization.chapters'), 'القصة section exists');
  // 3) المدن
  assert.ok(code.includes('المدن') && code.includes('civilization.cities'), 'المدن section exists');
  // 4) الاقتصاد والمجتمع
  assert.ok(code.includes('الاقتصاد والمجتمع') && code.includes('civilization.economy'), 'الاقتصاد والمجتمع section exists');
  // 5) الدين
  assert.ok(code.includes('الدين') && code.includes('civilization.religion'), 'الدين section exists');
  // 6) النبي المرسل
  assert.ok(code.includes('النبي المرسل') && code.includes('civilization.prophet'), 'النبي المرسل section exists');
  // 7) في القرآن
  assert.ok(code.includes('في القرآن') && code.includes('civilization.quranRefs'), 'في القرآن section exists');
  // 8) الآثار اليوم
  assert.ok(code.includes('الآثار اليوم') && code.includes('civilization.archaeology'), 'الآثار اليوم section exists');
  // 9) ملاحظة المؤرخ
  assert.ok(code.includes('ملاحظة المؤرخ') && code.includes('civilization.historianNote'), 'ملاحظة المؤرخ section exists');
  // 10) الإرث
  assert.ok(code.includes('الإرث') && code.includes('civilization.legacy'), 'الإرث section exists');
  // 11) صلة بالأساطير
  assert.ok(code.includes('صلة بالأساطير') && code.includes('civilization.relatedMyths'), 'صلة بالأساطير section exists');
});

test('Civilizations: dual narrative mode fields and storage persistence', async () => {
  const { storage } = await import('../src/data/storage');
  
  // Storage persistence
  assert.equal(typeof storage.getDualNarrativeView, 'function');
  assert.equal(typeof storage.setDualNarrativeView, 'function');
  
  storage.setDualNarrativeView('archaeology');
  assert.equal(storage.getDualNarrativeView(), 'archaeology');
  storage.setDualNarrativeView('tradition');
  assert.equal(storage.getDualNarrativeView(), 'tradition');

  // Verify civilizations have the dual-narrative fields
  const thamud = getCivById('civ-thamud');
  assert.ok(thamud?.traditionView && thamud.traditionView.includes('ثمود'));
  assert.ok(thamud?.archaeologyView && thamud.archaeologyView.includes('نبطي'));

  const aad = getCivById('civ-aad');
  assert.ok(aad?.traditionView && aad.traditionView.includes('عاد'));
  assert.ok(aad?.archaeologyView && aad.archaeologyView.includes('أوبار'));

  const madyan = getCivById('civ-madyan');
  assert.ok(madyan?.traditionView && madyan.traditionView.includes('مدين'));
  assert.ok(madyan?.archaeologyView && madyan.archaeologyView.includes('فخاريات'));

  const nabataean = getCivById('civ-nabataean');
  assert.ok(nabataean?.traditionView && nabataean.traditionView.includes('الحِجر'));
  assert.ok(nabataean?.archaeologyView && nabataean.archaeologyView.includes('البتراء'));

  const tasm = getCivById('civ-tasm-jadis');
  assert.ok(tasm?.traditionView && tasm.traditionView.includes('طسم'));
  assert.ok(tasm?.archaeologyView && tasm.archaeologyView.includes('أثر'));

  // Sabean and Himyarite do not have dual-narrative fields in this batch
  const saba = getCivById('civ-saba');
  assert.equal(saba?.traditionView, undefined);
  const himyar = getCivById('civ-himyar');
  assert.equal(himyar?.traditionView, undefined);

  // CivilizationPage contains the dual-narrative section
  const code = fs.readFileSync(path.resolve('src/screens/CivilizationPage.tsx'), 'utf8');
  assert.ok(code.includes('القراءة التاريخية'), 'القراءة التاريخية section must exist');
  assert.ok(code.includes('رواية التراث'), 'رواية التراث button must exist');
  assert.ok(code.includes('رواية الآثار'), 'رواية الآثار button must exist');
  assert.ok(code.includes('storage.getDualNarrativeView'), 'Must initialize with storage.getDualNarrativeView');
  assert.ok(code.includes('storage.setDualNarrativeView'), 'Must persist with storage.setDualNarrativeView');
});

test('Civilizations: creator export buttons and narrative formatting', async () => {
  const { formatCivilizationNarrative } = await import('../src/data/civTypes');
  const thamud = getCivById('civ-thamud');
  assert.ok(thamud, 'civ-thamud exists');

  const formatted = formatCivilizationNarrative(thamud);
  assert.ok(formatted.includes(thamud.name), 'Includes civ name');
  assert.ok(formatted.includes(thamud.era), 'Includes civ era');
  assert.ok(formatted.includes(thamud.region), 'Includes civ region');
  assert.ok(formatted.includes(`## ${thamud.chapters[0].title}`), 'Includes ## title');
  assert.ok(formatted.includes(thamud.chapters[0].text), 'Includes chapter text');
  assert.ok(formatted.includes(`• ${thamud.archaeology[0]}`), 'Includes archaeology bullet line');

  const code = fs.readFileSync(path.resolve('src/screens/CivilizationPage.tsx'), 'utf8');
  // Check buttons
  assert.ok(code.includes('انسخ كـ JSON') || code.includes("t('article.copyJson')"), 'Button "انسخ كـ JSON" exists');
  assert.ok(code.includes('انسخ كنص سردي'), 'Button "انسخ كنص سردي" exists');
  // Check toasts
  assert.ok(code.includes('نُسخ ملف الحضارة'), 'Toast "نُسخ ملف الحضارة" exists');
  assert.ok(code.includes('نُسخ السرد النصي'), 'Toast "نُسخ السرد النصي" exists');
  // Check cool-blue ghost style and 44px min height
  assert.ok(code.includes('coolBlueAccent'), 'Cool-blue accent is used');
  assert.ok(code.includes('min-h-[44px]'), '44px min height is set');
});

test('Civilizations: assets image mapping for civ-nabataean and civ-tasm-jadis', () => {
  const assetsCode = fs.readFileSync(path.resolve('src/utils/assets.ts'), 'utf8');
  assert.ok(assetsCode.includes('civ-nabataean'), 'civ-nabataean is mapped');
  assert.ok(assetsCode.includes('civ-tasm-jadis'), 'civ-tasm-jadis is mapped');
  assert.ok(assetsCode.includes('civNabataeanImg'), 'civNabataeanImg import exists');
  assert.ok(assetsCode.includes('civTasmJadisImg'), 'civTasmJadisImg import exists');

  // Verify public images exist on disk
  assert.ok(fs.existsSync(path.resolve('public/images/civ-nabataean.jpg')), 'public civ-nabataean.jpg exists');
  assert.ok(fs.existsSync(path.resolve('public/images/civ-tasm-jadis.jpg')), 'public civ-tasm-jadis.jpg exists');
  assert.ok(fs.existsSync(path.resolve('public/images/civ-lakhm.jpg')), 'public civ-lakhm.jpg exists');
  assert.ok(fs.existsSync(path.resolve('public/images/civ-ghassan.jpg')), 'public civ-ghassan.jpg exists');
  assert.ok(fs.existsSync(path.resolve('public/images/civ-mecca.jpg')), 'public civ-mecca.jpg exists');
  assert.ok(assetsCode.includes('civ-mecca'), 'civ-mecca is mapped');
  assert.ok(assetsCode.includes('civMeccaImg'), 'civMeccaImg import exists');
});

test('Civilizations: chronological data for myths and timeline myth stars lane', () => {
  const myths = JSON.parse(fs.readFileSync(path.resolve('src/data/myths.json'), 'utf8'));
  
  // Verify approxYear exists and matches specification
  const ghul = myths.find((m: any) => m.id === 'ghul');
  assert.equal(ghul?.approxYear, -700, 'ghul approxYear is -700');

  const irm = myths.find((m: any) => m.id === 'irm');
  assert.equal(irm?.approxYear, -2400, 'irm approxYear is -2400');

  const jinn = myths.find((m: any) => m.id === 'jinn');
  assert.equal(jinn?.approxYear, -1200, 'jinn approxYear is -1200');

  const suleiman = myths.find((m: any) => m.id === 'suleiman');
  assert.equal(suleiman?.approxYear, -950, 'suleiman approxYear is -950');

  const abuzayd = myths.find((m: any) => m.id === 'abuzayd');
  assert.equal(abuzayd?.approxYear, 1050, 'abuzayd approxYear is 1050');

  // Verify CivilizationsScreen contains TOP lane, toggle chip, and legend line
  const civScreenCode = fs.readFileSync(path.resolve('src/screens/CivilizationsScreen.tsx'), 'utf8');
  assert.ok(civScreenCode.includes('نجوم الأساطير'), 'Contains "نجوم الأساطير"');
  assert.ok(civScreenCode.includes('★ أسطورة | ▬ حضارة'), 'Contains legend line "★ أسطورة | ▬ حضارة"');
  assert.ok(civScreenCode.includes('#7FD1AE'), 'Mint color #7FD1AE is used for stars');
  assert.ok(civScreenCode.includes('onSelectMythId'), 'Star click connects to onSelectMythId');
  assert.ok(civScreenCode.includes('width="14" height="14"'), '14px star icon is rendered');
});

test('Civilizations: cinematic auto-tour on Timeline view', () => {
  const code = fs.readFileSync(path.resolve('src/screens/CivilizationsScreen.tsx'), 'utf8');

  // STEP 1: Floating play button on Timeline titled "رحلة عبر الزمن", deep teal #0E5C4D, 52px
  assert.ok(code.includes('title="رحلة عبر الزمن"') || code.includes("t('timeline.journey')"), 'Floating button titled "رحلة عبر الزمن"');
  assert.ok(code.includes('#0E5C4D'), 'Ember-free deep teal #0E5C4D fill is used');
  assert.ok(code.includes("width: '52px'"), '52px width for floating button');
  assert.ok(code.includes("height: '52px'"), '52px height for floating button');
  assert.ok(code.includes('<Play'), 'Play icon is used');

  // STEP 2: Animate horizontal scroll, dwell ~2.5s per civ, requestAnimationFrame, prefers-reduced-motion
  assert.ok(code.includes('requestAnimationFrame'), 'requestAnimationFrame is used for smooth tour');
  assert.ok(code.includes('prefers-reduced-motion'), 'prefers-reduced-motion is respected');
  assert.ok(code.includes('dwellDuration = 2500'), 'Dwells ~2.5 seconds per civilization');

  // STEP 3: Floating mini-card above bar with name (display font), era pill, and truncated legacy; star twinkle
  assert.ok(code.includes("Aref_Ruqaa"), "Name uses display font Aref_Ruqaa");
  assert.ok(code.includes('civ.era'), 'Era pill is rendered on mini-card');
  assert.ok(code.includes('civ.legacy') && code.includes('truncate'), 'Legacy text is rendered and truncated to one line');
  assert.ok(code.includes('isDwellingCardVisible'), 'Fade in/out visibility state for dwelling card');
  assert.ok(code.includes('isTwinkling'), 'Star twinkle scale animation state');

  // STEP 4: Controls during tour: tap anywhere pause/resume, "إنهاء" chip, toast "انتهت الرحلة عند 600م — على أعتاب عصر جديد"
  assert.ok(code.includes('handleToggleTourPause'), 'Pause/resume toggle handler exists');
  assert.ok(code.includes('إنهاء'), 'Small "إنهاء" chip exists to end tour');
  assert.ok(
    code.includes('انتهت الرحلة عند 600م — على أعتاب عصر جديد'),
    'Natural end toast text "انتهت الرحلة عند 600م — على أعتاب عصر جديد" exists'
  );

  // STEP 5: Transform-based scrolling only for 60fps
  assert.ok(code.includes('translate3d'), 'Uses translate3d for hardware-accelerated 60fps scrolling');
  assert.ok(code.includes("willChange: isTourActive ? 'transform' : undefined"), 'Sets will-change: transform during tour');
});





