import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Methodology: MethodologyScreen contains exact verbatim Arabic copy', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MethodologyScreen.tsx'), 'utf8');

  // Title & Intro
  assert.ok(code.includes('عن المنهج'), 'Contains title "عن المنهج"');
  assert.ok(
    code.includes('«مستكشف» لا يخلط المرويَّ بالموثَّق. كل نص في التطبيق يحمل واحدة من أربع شارات، ليعرف القارئ والكاتب والباحث ماذا يمسك تماماً.'),
    'Contains exact verbatim Intro copy'
  );

  // Card 1
  assert.ok(code.includes('نص حرفي'), 'Card 1 title "نص حرفي"');
  assert.ok(
    code.includes('منقول من القرآن أو الحديث أو كتاب موثوق مطبوع. قابل للنسخ مع مصدره، ولا زيادة فيه ولا نقص.'),
    'Card 1 verbatim body'
  );

  // Card 2
  assert.ok(code.includes('بأسلوب المصدر'), 'Card 2 title "بأسلوب المصدر"');
  assert.ok(
    code.includes('تلخيص بروح الكتاب القديم (الجاحظ، الكلبي، المسعودي…) لا بألفاظه. أمانةً في العزو: لا ننسب للكتاب لفظاً لم يكتبه.'),
    'Card 2 verbatim body'
  );

  // Card 3
  assert.ok(code.includes('الرواية الشعبية'), 'Card 3 title "الرواية الشعبية"');
  assert.ok(
    code.includes('ما يرويه الحكواتيون والجدّات والأسواق — ذاكرة الناس. تُحفظ كتراث ثقافي جدير بالتدوين، لا كتاريخ موثَّق.'),
    'Card 3 verbatim body'
  );

  // Card 4
  assert.ok(code.includes('التحليل التاريخي'), 'Card 4 title "التحليل التاريخي"');
  assert.ok(
    code.includes('ما تقوله الآثار والنقوش والتاريخ المقارن — بما فيه مواضع الاتفاق والخلاف مع الرواية. وحين تختلف الروايتان نعرضهما جنباً إلى جنب.'),
    'Card 4 verbatim body'
  );

  // Section "لماذا روايتان؟"
  assert.ok(code.includes('لماذا روايتان؟'), 'Section title "لماذا روايتان؟"');
  assert.ok(
    code.includes('لأن التراث ليس عدو العلم، ولا العلم عدو التراث: الأول يحفظ المعنى، والثاني يحقق الزمن. والقارئ الناضج يحتاجهما معاً.'),
    'Section verbatim body'
  );

  // Section "كيف أستشهد؟"
  assert.ok(code.includes('كيف أستشهد؟'), 'Section title "كيف أستشهد؟"');
  assert.ok(
    code.includes('الصيغة المقترحة: «تطبيق مستكشف — أساطير وحضارات العرب، بطاقة X، قسم Y، شارة Z». وفي البحوث العلمية تُفضَّل شارة «نص حرفي» مع مصدرها.'),
    'Section verbatim body'
  );
});

test('Methodology: Card 1 & 4 use mint accent; Card 2 & 3 use cool-blue accent with top label pills', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MethodologyScreen.tsx'), 'utf8');

  // Verify mint accent for Card 1 & 4 (#7FD1AE or rgba(127, 209, 174))
  assert.ok(code.includes('#8EDBC0') || code.includes('#7FD1AE') || code.includes('127, 209, 174'), 'Mint accent used for Card 1 & 4');

  // Verify cool-blue accent for Card 2 & 3 (#4A90D9 or rgba(74, 144, 217))
  assert.ok(code.includes('#ADCFF6') || code.includes('#4A90D9') || code.includes('74, 144, 217'), 'Cool-blue accent used for Card 2 & 3');

  // Each card shows its label pill at top
  assert.ok(code.includes('<span>نص حرفي</span>') || code.includes("t('method.literal')"), 'Card 1 top label pill');
  assert.ok(code.includes('<span>بأسلوب المصدر</span>') || code.includes("t('method.sourceStyle')"), 'Card 2 top label pill');
  assert.ok(code.includes('<span>الرواية الشعبية</span>') || code.includes("t('method.folk')"), 'Card 3 top label pill');
  assert.ok(code.includes('<span>التحليل التاريخي</span>') || code.includes("t('method.analysis')"), 'Card 4 top label pill');
});

test('Methodology: Profile row "عن المنهج" exists with info icon', () => {
  const profileCode = fs.readFileSync(path.resolve('src/screens/ProfileScreen.tsx'), 'utf8');
  assert.ok(profileCode.includes('عن المنهج'), 'Profile screen contains "عن المنهج" row');
  assert.ok(profileCode.includes('<Info size={20} />'), 'Row contains Info icon');
});

test('Methodology: Info icon next to "القراءة التاريخية" section heading in CivilizationPage and ArticleScreen', () => {
  const civPageCode = fs.readFileSync(path.resolve('src/screens/CivilizationPage.tsx'), 'utf8');
  assert.ok(civPageCode.includes('القراءة التاريخية'), 'CivilizationPage has "القراءة التاريخية"');
  assert.ok(
    civPageCode.includes('aria-label="عن المنهج"') || civPageCode.includes('title="عن المنهج"') || civPageCode.includes("t('method.title')"),
    'CivilizationPage has info icon button linking to methodology'
  );

  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf8');
  assert.ok(articleCode.includes('القراءة التاريخية'), 'ArticleScreen has "القراءة التاريخية"');
  assert.ok(
    articleCode.includes('aria-label="عن المنهج"') || articleCode.includes('title="عن المنهج"') || articleCode.includes("t('method.title')"),
    'ArticleScreen has info icon button linking to methodology'
  );
});
