import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDeepStory, hasDeepStory } from '../src/data/storyTypes';
import { MYTH_ENTRIES, getEntryById } from '../src/data/seed';
import { countWords } from '../src/utils/readingTime';
import { localizeEvidenceLabel, isDocumentedEvidenceLabel } from '../src/content';

const ROOT = process.cwd();

const EXPECTED_CH3_TITLE = 'مطلع الشمس والقوم الذين لا ستر لهم';
const EXPECTED_CH3_TEXT = `﴿ثُمَّ أَتْبَعَ سَبَبًا﴾.

توقّف عند هذه الجملة، فقد تكرّرت في السورة ثلاث مراتٍ بحرفها، كطرقةِ طبلٍ تسبق كل رحلة. لم يقل «ثم سار» ولا «ثم رحل»، بل ﴿أَتْبَعَ سَبَبًا﴾. والسَّبَب في أصل اللغة: الحبل الذي يُتوصَّل به إلى الشيء. فكل رحلةٍ من رحلاته حبلٌ جديد أمسك به، وكل حبلٍ أوصله إلى حيث لا يبلغ الناس. وهذا هو معنى ﴿وَآتَيْنَاهُ مِن كُلِّ شَيْءٍ سَبَبًا﴾: لم يُعطَ الأرض، أُعطي الطريق إليها.

﴿حَتَّىٰ إِذَا بَلَغَ مَطْلِعَ الشَّمْسِ وَجَدَهَا تَطْلُعُ عَلَىٰ قَوْمٍ لَّمْ نَجْعَل لَّهُم مِّن دُونِهَا سِتْرًا﴾.

بلغ المشرق الأقصى، حيث لا عمران وراءه. وهناك وجد قوماً لا شيء بينهم وبين الشمس: لا بناءٌ يظلّهم، ولا شجرٌ يحجبها، ولا ثوبٌ يقيهم. ذكر المفسرون في «الستر» وجوهاً: أن أرضهم لا تقبل البناء ولا تنبت الشجر، فهم إذا طلعت الشمس دخلوا المغاور والمياه؛ وأنهم لا يعرفون صناعة اللباس؛ وأن الشمس تطلع عليهم عموديةً فلا يظلّ لهم ظل. والقاسم المشترك بين الوجوه كلها: قومٌ مكشوفون للسماء، بلا وسيط.

وهنا لطيفةٌ لا ينتبه لها أكثر القرّاء: في المغرب خُيِّر ذو القرنين ﴿إِمَّا أَن تُعَذِّبَ وَإِمَّا أَن تَتَّخِذَ فِيهِمْ حُسْنًا﴾، وفي المشرق لم يُخيَّر. هناك حُكمٌ وتشريع، وهنا وصفٌ ومشاهدة. لماذا؟ لأن قوم المغرب كانوا في دائرة التكليف والرسالة، وقوم المشرق كانوا خارج ما بلغه الخطاب. فالرحلة الأولى رحلة سلطان، والثانية رحلة معرفة. ومن هنا يفهم صانع المحتوى أن البطل في هذه القصة ليس فاتحاً فقط، بل شاهداً؛ وأحياناً يكون أعظم ما يفعله الملك أن يرى ولا يتدخّل.

ثم يأتي الختم الذي يوقف الغرور عند حدّه: ﴿كَذَٰلِكَ وَقَدْ أَحَطْنَا بِمَا لَدَيْهِ خُبْرًا﴾. أي: هكذا كان أمره، وقد أحاط علمنا بما عنده من الأسباب والعدد والقدرة. فمهما بلغ من المشرق والمغرب، فأسبابه محصورةٌ معلومةٌ عند الله. بلغ قُرنَي الشمس، ولم يملك الشمس. وهذا هو الدرس الذي يسبق بناء السد: من عرف حدّ قوته، أحسن استعمالها.

[إعادة تخيل أدبي]
يقول الحكواتي: وصل ذو القرنين إلى المشرق قبل الفجر، فلما انشقّ الضوء رأى الناس ينزلون إلى الشقوق كما تنزل السحالي. لم يجرؤ أحدٌ على الوقوف في العراء. نادى كبير مهندسيه وقال: ابنِ لهم مدينةً تظلّهم. فقال المهندس: أستطيع أن أرفع جداراً، لكني لا أستطيع أن أزيح الشمس. فأطرق الملك، ثم قال: فاحفروا لهم مغاورَ أوسع، واجعلوا لها أفواهاً من جهة الشمال، واحفروا بئراً في كل مغارة. قالوا: هذا ليس مُلكاً يا ذا القرنين، هذا حفرٌ في الحجر. فقال: المُلك أن يجد الناس ظلاً لم يكونوا يجدونه. ومضى شرقاً وقد ترك خلفه قوماً لا يعرفون اسمه، وحجراً أبرد من الشمس.`;

const EXPECTED_CH4_TITLE = 'بين السدين ويأجوج ومأجوج';
const EXPECTED_CH4_TEXT = `﴿ثُمَّ أَتْبَعَ سَبَبًا  حَتَّىٰ إِذَا بَلَغَ بَيْنَ السَّدَّيْنِ وَجَدَ مِن دُونِهِمَا قَوْمًا لَّا يَكَادُونَ يَفْقَهُونَ قَوْلًا﴾.

الطريق الثالث: ليس أقصى الغرب ولا أقصى الشرق، بل ثغرةٌ بين جبلين. والسدّان في كلام المفسرين جبلان عظيمان يقومان مقام السور، وقيل سوران قديمان. وأما موضعهما فمختلَفٌ فيه اختلافاً واسعاً: قيل بين أرمينية وأذربيجان عند الباب الذي يُسمّى باب الأبواب، وقيل في أقاصي المشرق قرب الصين، وقيل في القوقاز. والحقّ أن النص لم يعيّن موضعاً، وأن كل تعيينٍ اجتهادٌ لا يقين. ومن الأمانة أن تُرسم الخريطة في تطبيقك عليها علامة استفهام، لا دبّوساً جازماً.

وأما القوم: ﴿لَّا يَكَادُونَ يَفْقَهُونَ قَوْلًا﴾. و«لا يكادون» تعني أنهم يفقهون قليلاً، لا أنهم صُمٌّ بكم. وهذا فرقٌ دقيق مهم: لو كانوا لا يفقهون شيئاً لما صحّ ما يأتي بعد. فقد قالوا له كلاماً مركّباً، وعرضوا عليه عقداً فيه شرطٌ وجزاءٌ ومقابلٌ مالي. قومٌ «لا يكادون يفقهون قولاً» يقدّمون عرضاً سياسياً واقتصادياً كاملاً! وهذا يعني أن حاجز اللسان لم يكن حاجز عقلٍ ولا تنظيم؛ كانوا يحتجون ويتعاقدون، ويحتاجون ترجماناً لا وصيّاً.

﴿قَالُوا يَا ذَا الْقَرْنَيْنِ إِنَّ يَأْجُوجَ وَمَأْجُوجَ مُفْسِدُونَ فِي الْأَرْضِ فَهَلْ نَجْعَلُ لَكَ خَرْجًا عَلَىٰ أَن تَجْعَلَ بَيْنَنَا وَبَيْنَهُمْ سَدًّا﴾.

الخَرْج: المال الذي يُدفع عن الأرض، ضريبةٌ أو أجرة. فهم يعرضون أن يموّلوا الحماية. وهنا يقع أنبل موقفٍ في القصة كلها:

﴿قَالَ مَا مَكَّنِّي فِيهِ رَبِّي خَيْرٌ فَأَعِينُونِي بِقُوَّةٍ أَجْعَلْ بَيْنَكُمْ وَبَيْنَهُمْ رَدْمًا﴾.

رفض المال، وطلب الأيدي. حوّل العقد من «ادفعوا لأحميكم» إلى «شاركوا فأحميكم». وهذا انقلابٌ في معنى السلطة: لم يجعلهم زبائن حماية، جعلهم شركاء بناء. ومن يقرأ الآية بعين صانع الألعاب يرى فيها ميكانيكا كاملة: لا يُشترى السد بالذهب، بل يُبنى بمساهمة القوم؛ فمن لم يشارك لم يُحمَ.

ولاحظ الترقية في اللفظ: هم سألوا سَدّاً، فوعدهم رَدْماً. والردم أوثق من السد؛ لأنه يُملأ بالحجارة والتراب والحديد طبقةً على طبقة حتى يصير كتلةً واحدة، لا جداراً يُنقب. أعطاهم أكثر مما سألوا، ورفض أن يأخذ منهم شيئاً. وهذا هو الفرق بين من يبني ليُذكر ومن يبني ليَحمي.

ومن يأجوج ومأجوج؟ جمهور ما ورد في الآثار أنهم من بني آدم، من ذرية يافث بن نوح، قبائلُ كثيرة العدد شديدة البأس، لا ملائكةٌ ولا شياطين. وفي الصحيحين أن الله يقول لآدم يوم القيامة: أخرج بعث النار، فيكون من كل ألفٍ تسعمائةٌ وتسعةٌ وتسعون، وأن هؤلاء من يأجوج ومأجوج. وأما رواية أنهم يحفرون السد كل يومٍ ثم يعود فيُعاد كما كان حتى يقولوا «إن شاء الله» — فهي في السنن، ومختلَفٌ في تصحيحها، فتُروى على أنها روايةٌ لا على أنها حقيقة قاطعة.

والمهم لصنّاع المحتوى: الوحش هنا بشريّ. وهذا أشدّ رعباً من كل غولٍ يتشكّل؛ لأن الغول خرافةٌ تُطرد بالذكر، أما القبيلة التي تأكل الأخضر واليابس فتُطرد بالحديد والنار والعمل الجماعي.

[إعادة تخيل أدبي]
يقول الحكواتي: جلس ذو القرنين بين السدين ومعه ترجمانٌ يتعب أكثر مما يتعب الجنود. كان شيخ القوم يشير إلى الجبل ثم إلى الأرض ثم إلى صدره، ويقول كلمةً واحدة يعيدها ثلاثاً. فقال الترجمان: يقول إنهم يخرجون في موسمٍ واحدٍ من السنة، فيأخذون الزرع والناس، ثم يعودون إلى الشِّعب. فقال الملك: وكم بقي من الموسم؟ فقال الشيخ بأصابعه: أربعون يوماً.

فأخرج ذو القرنين صرّة ذهبٍ ووضعها بين يديه، وقال: هذا أُجرة من عندي، لا خَرْجٌ من عندكم. ثم ردّ الشيخ الصرّة إليه، وقال كلمةً لم يحتج فيها إلى ترجمان: لا.

فقال ذو القرنين لقواده: لا أريد ذهبهم، أريد رجالهم. من حمل حجراً فله سهمٌ في السد، ومن قعد فليس له فيه باب. وفي تلك الليلة أُوقدت نيرانٌ بين الجبلين، وسمع الجبلُ صوتَ ألف مطرقةٍ لا تتكلّم لغةً واحدة، وتفهم بعضها بعضاً.`;

describe('Dhul-Qarnayn complete entry in stories.json', () => {
  it('merges Chapters 3 and 4 verbatim with exact brackets, markers, and evidenceLabel', () => {
    assert.equal(hasDeepStory('dhul-qarnayn'), true);
    const story = getDeepStory('dhul-qarnayn');
    assert.ok(story, 'dhul-qarnayn story must exist');
    assert.ok(Array.isArray(story.chapters));

    const ch3 = story.chapters[2];
    const ch4 = story.chapters[3];

    assert.equal(ch3.title, EXPECTED_CH3_TITLE);
    assert.equal(ch3.evidenceLabel, 'نص قرآني + أقوال المفسرين');
    assert.equal(ch3.text, EXPECTED_CH3_TEXT);

    assert.equal(ch4.title, EXPECTED_CH4_TITLE);
    assert.equal(ch4.evidenceLabel, 'نص قرآني + أقوال المفسرين');
    assert.equal(ch4.text, EXPECTED_CH4_TEXT);
  });

  it('contains 8 main chapters + 2 appendices with accurate per-chapter word counts and reading times', () => {
    const story = getDeepStory('dhul-qarnayn')!;
    const entry = getEntryById('dhul-qarnayn')!;
    assert.ok(entry);

    assert.equal(story.chaptersCount, 10);
    assert.equal(story.chapters!.length, 10);

    const expectedTitles = [
      'الممكّن في الأرض وأسباب المشرق والمغرب',
      'مغرب الشمس والعين الحمئة وقانون العدل',
      'مطلع الشمس والقوم الذين لا ستر لهم',
      'بين السدين ويأجوج ومأجوج',
      'بناء الردم: الحديد والنحاس',
      'من هو ذو القرنين؟ الأقوال التاريخية',
      'ذو القرنين في الشعر والتراث الشعبي',
      'يأجوج ومأجوج ونهاية العالم في النص',
      'عجائب ونصوص',
      'عدّة المبدع',
    ];
    assert.deepEqual(
      story.chapters!.map((c) => c.title),
      expectedTitles
    );

    const main = story.chapters!.filter((c) => !c.isAppendix);
    const appendices = story.chapters!.filter((c) => c.isAppendix);
    assert.equal(main.length, 8);
    assert.equal(appendices.length, 2);

    let chaptersWordSum = 0;
    for (const ch of story.chapters!) {
      assert.ok(ch.evidenceLabel && ch.evidenceLabel.trim().length > 0, `${ch.title} needs evidenceLabel`);
      const actualWords = countWords(ch.title) + countWords(ch.text);
      assert.equal(ch.wordCount, actualWords, `${ch.title} wordCount mismatch`);
      assert.equal(
        ch.estimatedReadingMinutes,
        Math.max(1, Math.ceil(actualWords / 180)),
        `${ch.title} reading minutes mismatch`
      );
      chaptersWordSum += actualWords;
    }

    const bodyWords = entry.body.reduce((acc, p) => acc + countWords(p), 0);
    assert.equal(story.totalWords, bodyWords + chaptersWordSum);
    assert.equal(
      story.estimatedReadingMinutes,
      Math.max(1, Math.ceil(story.totalWords! / 180))
    );
  });

  it('satisfies metadata requirements: quotes types, motifs, themes, cast, >=6 gameHooks, >=4 writingHooks', () => {
    const story = getDeepStory('dhul-qarnayn')!;
    assert.ok(Array.isArray(story.quotes) && story.quotes.length >= 4);
    for (const q of story.quotes) {
      assert.ok(q.text.trim().length > 0);
      assert.ok(q.source.trim().length > 0);
      assert.ok(
        q.type === 'نص حرفي' || q.type === 'بأسلوب المصدر',
        `Quote type must be نص حرفي or بأسلوب المصدر, got "${q.type}"`
      );
    }

    assert.ok(Array.isArray(story.motifs) && story.motifs.length >= 5);
    assert.ok(Array.isArray(story.themes) && story.themes.length >= 4);
    assert.ok(Array.isArray(story.cast) && story.cast.length >= 5);
    assert.ok(Array.isArray(story.gameHooks) && story.gameHooks.length >= 6);
    assert.ok(Array.isArray(story.writingHooks) && story.writingHooks.length >= 4);
  });

  it('enforces writing rules and UI evidence/gating wiring', () => {
    const story = getDeepStory('dhul-qarnayn')!;
    const ch1 = story.chapters![0].text;
    const ch2 = story.chapters![1].text;
    const ch5 = story.chapters![4].text;
    const ch8 = story.chapters![7].text;

    assert.ok(ch1.includes('ملكٌ صالحٌ') && ch1.includes('وليس نبياً'), 'Ch 1 must state Dhul-Qarnayn is a king, not a prophet');
    assert.ok(ch2.includes('لمشهد البصر') && ch2.includes('القرطبي'), 'Ch 2 must clarify visual perception with attributed exegete');
    assert.ok(ch5.includes('[إعادة تخيل أدبي]'), 'Ch 5 must contain dramatized section marker');
    assert.ok(ch8.includes('من بني آدم') && ch8.includes('مختلَفاً في تصحيحها'), 'Ch 8 must confirm human lineage and disputed Sunan narration');

    // Every chapter's evidenceLabel resolves cleanly in i18n helper
    for (const ch of story.chapters!) {
      assert.ok(localizeEvidenceLabel(ch.evidenceLabel!, 'en').length > 0);
    }
    assert.equal(isDocumentedEvidenceLabel('نص قرآني + أقوال المفسرين'), true);
    assert.equal(isDocumentedEvidenceLabel('تراث شعبي'), false);

    // MapScreen keeps barrier location explicitly uncertain
    const mapCode = fs.readFileSync(path.resolve(ROOT, 'src/screens/MapScreen.tsx'), 'utf-8');
    assert.match(mapCode, /موضع السد غير محدد \(؟\)/);

    // ArticleScreen renders per-chapter evidenceLabel pill, [إعادة تخيل أدبي], and gates Ch 2+
    const articleCode = fs.readFileSync(path.resolve(ROOT, 'src/screens/ArticleScreen.tsx'), 'utf-8');
    assert.match(articleCode, /chapter\.evidenceLabel/);
    assert.match(articleCode, /\[إعادة تخيل أدبي\]/);
    assert.match(articleCode, /isChapterLocked/);
    assert.match(articleCode, /!\(deepStory\?\.chapters && deepStory\.chapters\.length > 0\)/);
  });

  it('includes chapters 5-8, appendices A & B, and populated metadata in src/data/seed.ts', () => {
    const rawSeed = MYTH_ENTRIES.find((m) => m.id === 'dhul-qarnayn');
    const resolved = getEntryById('dhul-qarnayn');
    assert.ok(rawSeed, 'dhul-qarnayn must exist in MYTH_ENTRIES');
    assert.ok(resolved, 'dhul-qarnayn must resolve via getEntryById');

    for (const entry of [rawSeed, resolved]) {
      assert.equal(entry.chapters?.length, 10);
      assert.equal(entry.chapters![4].title, 'بناء الردم: الحديد والنحاس');
      assert.equal(entry.chapters![5].title, 'من هو ذو القرنين؟ الأقوال التاريخية');
      assert.equal(entry.chapters![6].title, 'ذو القرنين في الشعر والتراث الشعبي');
      assert.equal(entry.chapters![7].title, 'يأجوج ومأجوج ونهاية العالم في النص');
      assert.equal(entry.chapters![8].title, 'عجائب ونصوص');
      assert.equal(entry.chapters![8].isAppendix, true);
      assert.equal(entry.chapters![9].title, 'عدّة المبدع');
      assert.equal(entry.chapters![9].isAppendix, true);

      for (const ch of entry.chapters!) {
        assert.equal(ch.contentPending, false, `${ch.id} should not be pending`);
        assert.ok(ch.paragraphs.length > 0, `${ch.id} must have paragraphs`);
      }

      assert.ok(entry.metadata, 'metadata field must be populated');
      assert.equal(entry.metadata.chaptersCount, 10);
      assert.equal(entry.metadata.totalWords, 6284);
      assert.equal(entry.metadata.gameHooks.length, 6);
      assert.equal(entry.metadata.writingHooks.length, 4);
      assert.ok((entry.metadata.quotes?.length ?? 0) >= 6);
      assert.ok((entry.metadata.motifs?.length ?? 0) >= 7);
      assert.ok((entry.metadata.themes?.length ?? 0) >= 5);
      assert.ok((entry.metadata.cast?.length ?? 0) >= 7);
    }
  });
});
