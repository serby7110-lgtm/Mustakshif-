import type { AppLang } from '../i18n';
import type { MythChapter, MythEntry, MythSource, MythTimelinePoint } from '../data/types';
import type { Civilization, CivilizationChapter } from '../data/civTypes';
import type { DeepStory, DeepQuote, DeepChapter } from '../data/storyTypes';
import type { LongFormEntryData } from '../data/longForm';
import { PUBLIC_DOMAIN_STORIES } from './publicDomainStories';

import arContent from './ar.json';
import enContent from './en.json';
import idContent from './id.json';
import thContent from './th.json';

export interface LocalizedChapterTranslation {
  id?: string;
  title?: string;
  evidenceLabel?: string;
  paragraphs?: string[];
}

export interface LocalizedMythTranslation {
  name?: string;
  typeLabel?: string;
  entryType?: string;
  region?: string;
  summary?: string;
  body?: string[];
  sources?: MythSource[];
  timeline?: MythTimelinePoint[];
  mythTradition?: string;
  mythAnalysis?: string;
  evidenceLabels?: string[];
  chapters?: LocalizedChapterTranslation[];
}

export interface LocalizedCivilizationTranslation {
  name?: string;
  era?: string;
  region?: string;
  cities?: string[];
  economy?: string;
  society?: string;
  religion?: string;
  prophet?: string;
  quranRefs?: string[];
  archaeology?: string[];
  historianNote?: string;
  traditionView?: string;
  archaeologyView?: string;
  legacy?: string;
  chapters?: CivilizationChapter[];
}

export interface LocalizedContentBundle {
  myths: Record<string, LocalizedMythTranslation>;
  civilizations: Record<string, LocalizedCivilizationTranslation>;
  stories: Record<string, DeepStory>;
}

const CONTENT_BY_LANG: Record<AppLang, LocalizedContentBundle> = {
  ar: arContent as unknown as LocalizedContentBundle,
  en: enContent as unknown as LocalizedContentBundle,
  id: idContent as unknown as LocalizedContentBundle,
  th: thContent as unknown as LocalizedContentBundle,
};

const STORY_ID_ALIASES: Record<string, string> = {
  'al-ghul': 'ghul',
  'al-anqa': 'anqa',
  'iram-dhat-al-imad': 'irm',
  'al-si-la': 'saqlaba',
  'al-hama': 'hama',
  'wadi-abqar': 'wad_abqar',
  'al-sulayk': 'sulayk',
  'jadhima-al-abrash': 'jadhima',
  'al-shiqq': 'shiqq-satih',
  'kahana-arrafa': 'shiqq-satih',
  'nasnas': 'nasanis',
};

const TAG_MAP: Record<string, Record<AppLang, string>> = {
  'رعب': { ar: 'رعب', en: 'Horror', id: 'Horor', th: 'สยองขวัญ' },
  'تاريخ': { ar: 'تاريخ', en: 'History', id: 'Sejarah', th: 'ประวัติศาสตร์' },
  'خرافي': { ar: 'خرافي', en: 'Mythical', id: 'Mitologis', th: 'ตำนาน' },
  sacred_forest: { ar: 'الغابة والحصاد', en: 'Sacred Nature', id: 'Alam & Kesuburan', th: 'ป่าศักดิ์สิทธิ์และผืนดิน' },
  hero_quest: { ar: 'رحلة البطل', en: 'Hero’s Quest', id: 'Perjalanan Pahlawan', th: 'การเดินทางของวีรบุรุษ' },
  sky_water: { ar: 'السماء والماء', en: 'Sky & Water', id: 'Langit & Air', th: 'ฟากฟ้าและสายน้ำ' },
  cosmos_order: { ar: 'نظام الكون', en: 'Cosmic Order', id: 'Tatanan Kosmos', th: 'ระเบียบแห่งจักรวาล' },
  sacred_light: { ar: 'النور والبروج', en: 'Celestial Light', id: 'Cahaya Langit', th: 'แสงแห่งดวงดาว' },
  wisdom_wit: { ar: 'الحكمة والطرافة', en: 'Wisdom & Wit', id: 'Hikmah & Kecerdikan', th: 'ปัญญาและคติสอนใจ' },
  night_journey: { ar: 'مسرى الليل', en: 'Night Journey', id: 'Pengembaraan Malam', th: 'การเดินทางยามราตรี' },
};

const ERA_MAP: Record<string, Record<AppLang, string>> = {
  'جاهلية': { ar: 'جاهلية', en: 'Pre-Islamic Era', id: 'Era Pra-Islam', th: 'ยุคก่อนอิสลาม' },
  'الجاهلية': { ar: 'الجاهلية', en: 'Pre-Islamic Era', id: 'Era Pra-Islam', th: 'ยุคก่อนอิสลาม' },
  'صدر الإسلام': { ar: 'صدر الإسلام', en: 'Early Islam', id: 'Awal Islam', th: 'ยุคต้นอิสลาม' },
  'العصر العباسي': { ar: 'العصر العباسي', en: 'Abbasid Era', id: 'Era Abbasiyah', th: 'ยุคอับบาซียะฮ์' },
};

const EVIDENCE_LABEL_MAP: Record<string, Record<AppLang, string>> = {
  'نص قرآني': { ar: 'نص قرآني', en: 'Quranic Text', id: 'Teks Al-Quran', th: 'โองการอัลกุรอาน' },
  'نص ديني': { ar: 'نص ديني', en: 'Scriptural Text', id: 'Teks Keagamaan', th: 'คัมภีร์ศาสนา' },
  'أقوال المفسرين': { ar: 'أقوال المفسرين', en: 'Classical Exegesis', id: 'Tafsir Klasik', th: 'อรรถาธิบายนักตัฟซีร' },
  'إعادة تخيل أدبي': { ar: 'إعادة تخيل أدبي', en: 'Literary Reimagining', id: 'Rekonstruksi Sastra', th: 'จินตนาการเชิงวรรณกรรม' },
  'خيال أدبي': { ar: 'خيال أدبي', en: 'Literary Fiction', id: 'Fiksi Sastra', th: 'วรรณกรรมจินตนาการ' },
  'موثق تاريخياً': { ar: 'موثق تاريخياً', en: 'Historically Documented', id: 'Terdokumentasi Secara Sejarah', th: 'มีหลักฐานทางประวัติศาสตร์' },
  'من عجائب روايته': { ar: 'من عجائب روايته', en: 'Marvels of His Account', id: 'Keajaiban Kisahnya', th: 'สิ่งอัศจรรย์ในบันทึก' },
  'نص حرفي': { ar: 'نص حرفي', en: 'Verbatim Text', id: 'Teks Harfiah', th: 'ตัวบทต้นฉบับ' },
  'بأسلوب المصدر': { ar: 'بأسلوب المصدر', en: 'Classical Tone', id: 'Gaya Sumber Klasik', th: 'ตามสำนวนคัมภีร์เก่า' },
  'نص قرآني + أقوال المفسرين': {
    ar: 'نص قرآني + أقوال المفسرين',
    en: 'Quranic Text + Classical Exegesis',
    id: 'Teks Al-Quran + Tafsir Klasik',
    th: 'โองการอัลกุรอาน + อรรถาธิบายนักตัฟซีร',
  },
  'أقوال المفسرين + تحليل تاريخي': {
    ar: 'أقوال المفسرين + تحليل تاريخي',
    en: 'Classical Exegesis + Historical Analysis',
    id: 'Tafsir Klasik + Analisis Sejarah',
    th: 'อรรถาธิบายนักตัฟซีร + การวิเคราะห์ทางประวัติศาสตร์',
  },
  'تراث شعبي': {
    ar: 'تراث شعبي',
    en: 'Folk Heritage',
    id: 'Warisan Rakyat',
    th: 'มุขปาฐะและคติชน',
  },
  'نص قرآني + حديث + أقوال المفسرين': {
    ar: 'نص قرآني + حديث + أقوال المفسرين',
    en: 'Quranic Text + Hadith + Classical Exegesis',
    id: 'Teks Al-Quran + Hadis + Tafsir Klasik',
    th: 'โองการอัลกุรอาน + ฮะดีษ + อรรถาธิบาย',
  },
  'نصوص ومقتطفات': {
    ar: 'نصوص ومقتطفات',
    en: 'Primary Texts & Excerpts',
    id: 'Teks & Kutipan Primer',
    th: 'ตัวบทและข้อความคัดสรร',
  },
  'أدوات إبداعية': {
    ar: 'أدوات إبداعية',
    en: 'Creative Tools',
    id: 'Perangkat Kreatif',
    th: 'เครื่องมือสร้างสรรค์',
  },
};

const nonEmptyStr = (candidate: unknown, fallback: string, onMissing?: () => void): string => {
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate;
  }
  onMissing?.();
  return fallback;
};

const mergeStringArray = (
  candidate: string[] | undefined,
  fallback: string[] | undefined,
  onMissing?: () => void
): string[] => {
  const base = Array.isArray(fallback) ? fallback : [];
  const cleaned = Array.isArray(candidate)
    ? candidate.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];
  if (cleaned.length > 0) {
    return cleaned;
  }
  if (base.length > 0) onMissing?.();
  return base;
};

export function localizeTag(tag: string, lang: AppLang): string {
  return TAG_MAP[tag]?.[lang] ?? tag;
}

export function localizeEra(era: string, lang: AppLang): string {
  return ERA_MAP[era]?.[lang] ?? era;
}

export function localizeEvidenceLabel(label: string, lang: AppLang): string {
  return EVIDENCE_LABEL_MAP[label]?.[lang] ?? label;
}

export function isDocumentedEvidenceLabel(label: string): boolean {
  return (
    label.includes('موثق تاريخياً') ||
    label.includes('نص قرآني') ||
    label.includes('نص ديني') ||
    label.includes('حديث') ||
    label.includes('نصوص ومقتطفات') ||
    label === EVIDENCE_LABEL_MAP['موثق تاريخياً'].en ||
    label === EVIDENCE_LABEL_MAP['موثق تاريخياً'].id ||
    label === EVIDENCE_LABEL_MAP['موثق تاريخياً'].th ||
    label === EVIDENCE_LABEL_MAP['نص قرآني'].en ||
    label === EVIDENCE_LABEL_MAP['نص قرآني'].id ||
    label === EVIDENCE_LABEL_MAP['نص قرآني'].th ||
    label === EVIDENCE_LABEL_MAP['نص ديني'].en ||
    label === EVIDENCE_LABEL_MAP['نص ديني'].id ||
    label === EVIDENCE_LABEL_MAP['نص ديني'].th
  );
}

export type LocalizedMythEntry = MythEntry & { hasMissingTranslation?: boolean };
export type LocalizedLongFormEntry = LongFormEntryData & { hasMissingTranslation?: boolean };
export type LocalizedCivilization = Civilization & { hasMissingTranslation?: boolean };
export type LocalizedDeepStory = DeepStory & { hasMissingTranslation?: boolean };

export function getLocalizedEntry(entry: MythEntry, lang: AppLang): LocalizedMythEntry {
  if (!entry) return entry;

  const pdItem = PUBLIC_DOMAIN_STORIES.find((item) => item.id === entry.id);
  if (pdItem) {
    const typeLabels: Record<string, Record<AppLang, string>> = {
      story: { ar: 'قصة', en: 'Story', id: 'Kisah', th: 'นิทาน' },
      myth: { ar: 'أسطورة', en: 'Myth', id: 'Mitologi', th: 'ตำนาน' },
      cosmology: { ar: 'كوسمولوجيا', en: 'Cosmology', id: 'Kosmologi', th: 'จักรวาลวิทยา' },
      folklore: { ar: 'فلكلور', en: 'Folklore', id: 'Cerita Rakyat', th: 'คติชน' },
    };
    const localizedType = typeLabels[pdItem.type]?.[lang] ?? entry.typeLabel;
    return {
      ...entry,
      name: pdItem.title[lang] || entry.name,
      typeLabel: localizedType,
      entryType: localizedType,
      region: pdItem.region.label[lang] || entry.region,
      summary: pdItem.summary[lang] || entry.summary,
      body: pdItem.text[lang]?.length ? pdItem.text[lang] : entry.body,
      sources: [
        {
          title: pdItem.source.title[lang] || pdItem.source.title.ar,
          author: pdItem.source.author[lang] || pdItem.source.author.ar,
          year: pdItem.source.year || '',
        },
      ],
      hasMissingTranslation: false,
    };
  }

  if (lang === 'ar') return entry;

  const bundle = CONTENT_BY_LANG[lang] ?? CONTENT_BY_LANG.ar;
  const tr = bundle.myths?.[entry.id];
  const arFallback = (CONTENT_BY_LANG.ar.myths?.[entry.id] ?? {}) as LocalizedMythTranslation;

  if (!tr) {
    return {
      ...entry,
      hasMissingTranslation: true,
    };
  }

  let missing = false;
  const markMissing = () => {
    missing = true;
  };

  const rawSources = Array.isArray(entry.sources) ? entry.sources : [];
  const mergedSources: MythSource[] =
    Array.isArray(tr.sources) && tr.sources.length > 0
      ? tr.sources.map((trSrc, idx) => {
          const fbSrc = arFallback.sources?.[idx] ?? rawSources[idx] ?? { title: '', author: '', year: '' };
          return {
            title: nonEmptyStr(trSrc?.title, fbSrc?.title ?? '', markMissing),
            author: nonEmptyStr(trSrc?.author, fbSrc?.author ?? '', markMissing),
            year: nonEmptyStr(trSrc?.year, fbSrc?.year ?? '', markMissing),
          };
        })
      : rawSources.map((src, idx) => {
          if (rawSources.length > 0) markMissing();
          const fbSrc = arFallback.sources?.[idx] ?? src;
          return {
            title: fbSrc?.title ?? '',
            author: fbSrc?.author ?? '',
            year: fbSrc?.year ?? '',
          };
        });

  const rawTimeline = Array.isArray(entry.timeline) ? entry.timeline : [];
  const mergedTimeline: MythTimelinePoint[] =
    Array.isArray(tr.timeline) && tr.timeline.length > 0
      ? tr.timeline.map((trPt, idx) => {
          const fbPt = arFallback.timeline?.[idx] ?? rawTimeline[idx] ?? { era: '', note: '' };
          return {
            era: nonEmptyStr(trPt?.era, localizeEra(fbPt?.era ?? '', lang)),
            note: nonEmptyStr(trPt?.note, fbPt?.note ?? '', markMissing),
          };
        })
      : rawTimeline.map((pt, idx) => {
          if (rawTimeline.length > 0) markMissing();
          const fbPt = arFallback.timeline?.[idx] ?? pt;
          return {
            era: localizeEra(fbPt?.era ?? '', lang),
            note: fbPt?.note ?? '',
          };
        });

  const mergedChapters: MythChapter[] | undefined = Array.isArray(entry.chapters)
    ? entry.chapters.map((ch, idx) => {
        const trCh =
          (ch?.id ? tr.chapters?.find((c) => c?.id === ch.id) : undefined) ??
          tr.chapters?.[idx];
        const fbCh = arFallback.chapters?.[idx];
        return {
          ...ch,
          title: nonEmptyStr(trCh?.title, fbCh?.title ?? ch?.title ?? '', markMissing),
          evidenceLabel: nonEmptyStr(
            trCh?.evidenceLabel,
            localizeEvidenceLabel(fbCh?.evidenceLabel ?? ch?.evidenceLabel ?? '', lang)
          ),
          paragraphs: mergeStringArray(
            trCh?.paragraphs,
            fbCh?.paragraphs?.length ? fbCh.paragraphs : ch?.paragraphs,
            markMissing
          ),
        };
      })
    : undefined;

  return {
    ...entry,
    name: nonEmptyStr(tr.name, arFallback.name ?? entry.name, markMissing),
    typeLabel: nonEmptyStr(tr.typeLabel, arFallback.typeLabel ?? entry.typeLabel, markMissing),
    entryType: entry.entryType
      ? nonEmptyStr(tr.entryType ?? tr.typeLabel, arFallback.entryType ?? entry.entryType, markMissing)
      : undefined,
    region: nonEmptyStr(tr.region, arFallback.region ?? entry.region, markMissing),
    summary: nonEmptyStr(tr.summary, arFallback.summary ?? entry.summary, markMissing),
    body: mergeStringArray(tr.body, arFallback.body ?? entry.body, markMissing),
    sources: mergedSources,
    timeline: mergedTimeline,
    mythTradition: entry.mythTradition
      ? nonEmptyStr(tr.mythTradition, arFallback.mythTradition ?? entry.mythTradition, markMissing)
      : undefined,
    mythAnalysis: entry.mythAnalysis
      ? nonEmptyStr(tr.mythAnalysis, arFallback.mythAnalysis ?? entry.mythAnalysis, markMissing)
      : undefined,
    evidenceLabels: entry.evidenceLabels
      ? (tr.evidenceLabels && tr.evidenceLabels.length > 0
          ? tr.evidenceLabels
          : entry.evidenceLabels.map((lbl) => localizeEvidenceLabel(lbl, lang)))
      : undefined,
    chapters: mergedChapters,
    hasMissingTranslation: missing,
  };
}

export function getLocalizedLongFormEntry(
  entry: LongFormEntryData,
  lang: AppLang
): LocalizedLongFormEntry {
  const localized = getLocalizedEntry(entry as unknown as MythEntry, lang);
  return {
    ...entry,
    name: localized.name,
    typeLabel: localized.typeLabel,
    entryType: localized.entryType || localized.typeLabel,
    region: localized.region,
    summary: localized.summary,
    body: localized.body,
    sources: localized.sources,
    timeline: localized.timeline,
    evidenceLabels: localized.evidenceLabels || entry.evidenceLabels,
    chapters: (localized.chapters || entry.chapters) as LongFormEntryData['chapters'],
    hasMissingTranslation: localized.hasMissingTranslation,
  };
}

export function getLocalizedCivilization(
  civ: Civilization,
  lang: AppLang
): LocalizedCivilization {
  if (!civ || lang === 'ar') return civ;

  const bundle = CONTENT_BY_LANG[lang] ?? CONTENT_BY_LANG.ar;
  const tr = bundle.civilizations?.[civ.id];
  const arFallback = (CONTENT_BY_LANG.ar.civilizations?.[civ.id] ?? {}) as LocalizedCivilizationTranslation;

  if (!tr) {
    return {
      ...civ,
      hasMissingTranslation: true,
    };
  }

  let missing = false;
  const markMissing = () => {
    missing = true;
  };

  const mergedChapters: CivilizationChapter[] = (Array.isArray(civ.chapters) ? civ.chapters : []).map((ch, idx) => {
    const trCh = tr.chapters?.[idx];
    const fbCh = arFallback.chapters?.[idx] ?? ch;
    return {
      title: nonEmptyStr(trCh?.title, fbCh?.title ?? '', markMissing),
      text: nonEmptyStr(trCh?.text, fbCh?.text ?? '', markMissing),
    };
  });

  return {
    ...civ,
    name: nonEmptyStr(tr.name, arFallback.name ?? civ.name, markMissing),
    era: nonEmptyStr(tr.era, arFallback.era ?? civ.era, markMissing),
    region: nonEmptyStr(tr.region, arFallback.region ?? civ.region, markMissing),
    cities: mergeStringArray(tr.cities, arFallback.cities ?? civ.cities, markMissing),
    economy: nonEmptyStr(tr.economy, arFallback.economy ?? civ.economy, markMissing),
    society: nonEmptyStr(tr.society, arFallback.society ?? civ.society, markMissing),
    religion: nonEmptyStr(tr.religion, arFallback.religion ?? civ.religion, markMissing),
    prophet: nonEmptyStr(tr.prophet, arFallback.prophet ?? civ.prophet, markMissing),
    quranRefs: mergeStringArray(tr.quranRefs, arFallback.quranRefs ?? civ.quranRefs, markMissing),
    archaeology: mergeStringArray(tr.archaeology, arFallback.archaeology ?? civ.archaeology, markMissing),
    historianNote: civ.historianNote
      ? nonEmptyStr(tr.historianNote, arFallback.historianNote ?? civ.historianNote, markMissing)
      : undefined,
    traditionView: civ.traditionView
      ? nonEmptyStr(tr.traditionView, arFallback.traditionView ?? civ.traditionView, markMissing)
      : undefined,
    archaeologyView: civ.archaeologyView
      ? nonEmptyStr(tr.archaeologyView, arFallback.archaeologyView ?? civ.archaeologyView, markMissing)
      : undefined,
    legacy: nonEmptyStr(tr.legacy, arFallback.legacy ?? civ.legacy, markMissing),
    chapters: mergedChapters,
    hasMissingTranslation: missing,
  };
}

function resolveStoryKey(storiesMap: Record<string, DeepStory>, mythId: string): string | undefined {
  if (!mythId) return undefined;
  if (STORY_ID_ALIASES[mythId] && storiesMap[STORY_ID_ALIASES[mythId]]) {
    return STORY_ID_ALIASES[mythId];
  }
  if (storiesMap[mythId]) return mythId;
  if (mythId.startsWith('al-') && storiesMap[mythId.slice(3)]) {
    return mythId.slice(3);
  }
  if (!mythId.startsWith('al-') && storiesMap[`al-${mythId}`]) {
    return `al-${mythId}`;
  }
  return undefined;
}

export function getLocalizedDeepStory(
  baseStory: DeepStory | undefined,
  mythId: string,
  lang: AppLang
): LocalizedDeepStory | undefined {
  if (!baseStory) return undefined;
  if (lang === 'ar') return baseStory;

  const bundle = CONTENT_BY_LANG[lang] ?? CONTENT_BY_LANG.ar;
  const arStories = CONTENT_BY_LANG.ar.stories ?? {};
  const storyKey = resolveStoryKey(arStories, mythId) ?? resolveStoryKey(bundle.stories ?? {}, mythId);
  const tr = storyKey ? bundle.stories?.[storyKey] : undefined;

  if (!tr) {
    return {
      ...baseStory,
      hasMissingTranslation: true,
    };
  }

  let missing = false;
  const markMissing = () => {
    missing = true;
  };

  const chapters: DeepChapter[] | undefined = baseStory.chapters
    ? baseStory.chapters.map((ch, idx) => ({
        ...ch,
        title: nonEmptyStr(tr.chapters?.[idx]?.title, ch.title, markMissing),
        text: nonEmptyStr(tr.chapters?.[idx]?.text, ch.text, markMissing),
        evidenceLabel: ch.evidenceLabel
          ? nonEmptyStr(tr.chapters?.[idx]?.evidenceLabel, localizeEvidenceLabel(ch.evidenceLabel, lang))
          : undefined,
      }))
    : undefined;

  const baseQuotes = Array.isArray(baseStory.quotes) ? baseStory.quotes : undefined;
  const quotes: DeepQuote[] | undefined = baseQuotes
    ? Array.isArray(tr.quotes) && tr.quotes.length > 0
      ? tr.quotes.map((trQ, idx) => {
          const fbQ = baseQuotes[idx] ?? baseQuotes[0];
          return {
            text: nonEmptyStr(trQ?.text, fbQ?.text ?? '', markMissing),
            source: nonEmptyStr(trQ?.source, fbQ?.source ?? '', markMissing),
            type: nonEmptyStr(trQ?.type, localizeEvidenceLabel(fbQ?.type ?? 'نص حرفي', lang)),
          };
        })
      : (() => {
          if (baseQuotes.length > 0) markMissing();
          return baseQuotes.map((q) => ({
            ...q,
            type: localizeEvidenceLabel(q.type, lang),
          }));
        })()
    : undefined;

  const scenes: DeepChapter[] | undefined = baseStory.scenes
    ? baseStory.scenes.map((sc, idx) => ({
        title: nonEmptyStr(tr.scenes?.[idx]?.title, sc.title, markMissing),
        text: nonEmptyStr(tr.scenes?.[idx]?.text, sc.text, markMissing),
      }))
    : undefined;

  return {
    ...baseStory,
    chapters,
    quotes,
    motifs: baseStory.motifs ? mergeStringArray(tr.motifs, baseStory.motifs, markMissing) : undefined,
    themes: baseStory.themes ? mergeStringArray(tr.themes, baseStory.themes, markMissing) : undefined,
    cast: baseStory.cast ? mergeStringArray(tr.cast, baseStory.cast, markMissing) : undefined,
    gameHooks: baseStory.gameHooks ? mergeStringArray(tr.gameHooks, baseStory.gameHooks, markMissing) : undefined,
    writingHooks: baseStory.writingHooks
      ? mergeStringArray(tr.writingHooks, baseStory.writingHooks, markMissing)
      : undefined,
    traits: baseStory.traits ? mergeStringArray(tr.traits, baseStory.traits, markMissing) : undefined,
    storyHooks: baseStory.storyHooks ? mergeStringArray(tr.storyHooks, baseStory.storyHooks, markMissing) : undefined,
    gameRoles: baseStory.gameRoles ? mergeStringArray(tr.gameRoles, baseStory.gameRoles, markMissing) : undefined,
    scenes,
    decision: baseStory.decision ? nonEmptyStr(tr.decision, baseStory.decision, markMissing) : undefined,
    hasMissingTranslation: missing,
  };
}
